using Lumiere.Application.Services;
using Lumiere.Application.Workers;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Lumiere.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class IntegrationFlowTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task EndToEndEventLifecycle_FullFlow_ExecutesAndLogsAuditTrail()
        {
            // 1. Setup DB Context
            using var db = GetInMemoryDbContext();
            var auditLogService = new AuditLogService(db);
            var userId = Guid.NewGuid();

            // 2. Step 1: Create Event
            var eventService = new EventService(db, auditLogService);
            var createEventReq = new CreateEventRequest
            {
                EventName = "La Nuit Dorée",
                DateOfEvent = DateTime.Today.AddDays(5),
                IngressDate = DateTime.Today.AddDays(4),
                IngressTime = TimeSpan.FromHours(8),
                FullStop = TimeSpan.FromHours(23),
                EventVenue = "Palais de Luxe",
                GeoClass = "Local"
            };

            var eventId = await eventService.CreateEventAsync(createEventReq, userId);
            Assert.NotEqual(Guid.Empty, eventId);

            // 3. Step 2: Register Asset
            var assetService = new AssetService(db, auditLogService, null!);
            var createAssetReq = new CreateAssetRequest
            {
                Name = "Gilded Archway Structure",
                Description = "Modular gold truss archway",
                AssetTier = 1,
                Quantity = 10,
                CatalogPhotoUrl = "https://example.com/archway.jpg"
            };

            var assetId = await assetService.CreateAssetAsync(createAssetReq, userId, new List<string> { "Warehouse Operations Manager" });
            Assert.NotEqual(Guid.Empty, assetId);

            // 4. Step 3: Reserve Asset (Committed)
            var reservationService = new ReservationService(db, null!);
            var reserveReq = new BulkReservationRequest
            {
                EventId = eventId,
                AssetIds = new List<Guid> { assetId },
                LockStart = DateTimeOffset.UtcNow.AddDays(4),
                LockEnd = DateTimeOffset.UtcNow.AddDays(6)
            };

            var reserveResp = await reservationService.ReserveAssetsBulkAsync(reserveReq, userId);
            Assert.NotEmpty(reserveResp.ReservationIds);

            var asset = await db.Assets.FindAsync(assetId);
            Assert.Equal("Committed", asset!.AssetState);

            // 5. Step 4: Dispatch Preparation (Committed -> Prepping)
            var dispatchService = new DispatchService(db, null!);
            await dispatchService.PrepareDispatchAsync(eventId, userId);

            asset = await db.Assets.FindAsync(assetId);
            Assert.Equal("Prepping", asset!.AssetState);

            // 6. Step 5: Item Outbound Verification (Prepping -> In-Transit Outbound)
            var verifyResp = await dispatchService.VerifyItemAsync(eventId, assetId, userId);
            Assert.True(verifyResp.IsBatchComplete);

            asset = await db.Assets.FindAsync(assetId);
            Assert.Equal("In-Transit Outbound", asset!.AssetState);

            // 7. Step 6: Ground Crew On-Site Arrival (In-Transit Outbound -> On-Site)
            await dispatchService.UpdateAssetStateAtomicAsync(assetId, "On-Site", userId, eventId);
            asset = await db.Assets.FindAsync(assetId);
            Assert.Equal("On-Site", asset!.AssetState);

            // 8. Step 7: Ground Crew Damage Incident Report & Auto Deficit Queue
            var damageService = new DamageReportService(db);
            var damageReq = new CreateDamageReportRequest
            {
                EventId = eventId,
                AssetId = assetId,
                DamagedQuantity = 1,
                PhotoUrl = "https://example.com/damage-arch.jpg",
                Sha256Hash = "hash12345",
                Severity = "Critical"
            };

            var reportId = await damageService.SubmitDamageReportAsync(damageReq, userId);
            Assert.NotEqual(Guid.Empty, reportId);

            var deficit = await db.DeficitQueue.FirstOrDefaultAsync(d => d.EventId == eventId && d.AssetId == assetId);
            Assert.NotNull(deficit);
            Assert.Equal(1, deficit.QuantityNeeded);

            // 9. Step 8: Deficit Resolution via Procurement/Vendor Restock
            var deficitService = new DeficitQueueService(db);
            await deficitService.UpdateStatusAsync(deficit.Id, new UpdateDeficitStatusRequest { Status = DeficitStatus.Received, PoRef = "PO-LUMIERE-001" }, userId);

            var resolvedDeficit = await db.DeficitQueue.FindAsync(deficit.Id);
            Assert.Equal(DeficitStatus.Received, resolvedDeficit!.DeficitStatus);

            // 10. Audit Verification: Ensure audit logs recorded key operations
            var auditLogs = await db.AuditLogs.ToListAsync();
            Assert.NotEmpty(auditLogs);
            Assert.Contains(auditLogs, l => l.ActionType == "EVENT_INITIALIZED");
            Assert.Contains(auditLogs, l => l.ActionType == "STATE_CHANGE");
            Assert.Contains(auditLogs, l => l.ActionType == "RESERVATION_STAGED");
            Assert.Contains(auditLogs, l => l.ActionType == "DISPATCH_PREP_STARTED");
            Assert.Contains(auditLogs, l => l.ActionType == "ITEM_DISPATCH_VERIFIED");
            Assert.Contains(auditLogs, l => l.ActionType == "STATE_MUTATION");
        }

        [Fact]
        public async Task LostInActionAuditWorker_ExpiredTicket_DeclaresFinancialLoss()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var ticketId = Guid.NewGuid();
            var assetId = Guid.NewGuid();

            db.InvestigationTickets.Add(new InvestigationTicket
            {
                Id = ticketId,
                AssetId = assetId,
                TicketStatus = "Open",
                OpenedAt = DateTime.UtcNow.AddDays(-10),
                AutoExpireAt = DateTime.UtcNow.AddDays(-1) // Already expired
            });
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            services.AddScoped<IAuditLogService, AuditLogService>();
            var provider = services.BuildServiceProvider();

            var worker = new LostInActionAuditWorker(provider, NullLogger<LostInActionAuditWorker>.Instance);

            // Act - call private ProcessLostInActionTickets using reflection
            var method = typeof(LostInActionAuditWorker).GetMethod("ProcessLostInActionTickets", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            await (Task)method!.Invoke(worker, new object[] { CancellationToken.None })!;

            // Assert
            var ticket = await db.InvestigationTickets.FindAsync(ticketId);
            Assert.NotNull(ticket);
            Assert.Equal("Declared Financial Loss", ticket.TicketStatus);

            var auditLog = await db.AuditLogs.FirstOrDefaultAsync(l => l.AffectedRecordId == ticketId && l.ActionType == "LIA_DECLARED");
            Assert.NotNull(auditLog);
        }

        [Fact]
        public async Task EphemeralExpiryAuditWorker_ExpiredPermission_LogsExpiryAuditRecord()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var permId = Guid.NewGuid();

            db.EphemeralPermissions.Add(new EphemeralPermission
            {
                Id = permId,
                UserId = Guid.NewGuid(),
                TempRoleId = Guid.NewGuid(),
                StartTimestamp = DateTime.UtcNow.AddHours(-5),
                EndTimestamp = DateTime.UtcNow.AddHours(-1), // Expired
                AuthReason = "Short-term override"
            });
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            services.AddScoped<IAuditLogService, AuditLogService>();
            var provider = services.BuildServiceProvider();

            var worker = new EphemeralExpiryAuditWorker(provider, NullLogger<EphemeralExpiryAuditWorker>.Instance);

            // Act - call private ProcessExpiredPermissionsAsync using reflection
            var method = typeof(EphemeralExpiryAuditWorker).GetMethod("ProcessExpiredPermissionsAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            await (Task)method!.Invoke(worker, new object[] { CancellationToken.None })!;

            // Assert
            var auditLog = await db.AuditLogs.FirstOrDefaultAsync(l => l.AffectedRecordId == permId && l.ActionType == "EPHEMERAL_EXPIRY");
            Assert.NotNull(auditLog);
        }
    }
}
