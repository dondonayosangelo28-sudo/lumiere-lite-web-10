using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Application.Services;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Lumiere.Tests
{
    public class OfflineSyncServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task ProcessBatchSyncAsync_OutboundConfirmation_UpdatesAssetStateToInTransitOutbound()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            db.Assets.Add(new Asset { Id = assetId, Name = "LED Screen", AssetState = "Prepping" });
            db.Events.Add(new Event { Id = eventId, Name = "Concert 2026", DateOfEvent = DateTime.Today });
            await db.SaveChangesAsync();

            var service = new OfflineSyncService(db);
            var request = new FieldReportSyncRequestDto
            {
                Items = new List<FieldReportSyncItemDto>
                {
                    new FieldReportSyncItemDto
                    {
                        ClientTxId = "tx-outbound-1",
                        EventType = "CONFIRM_OUTBOUND",
                        EventId = eventId,
                        AssetId = assetId,
                        SubmittedAt = DateTime.UtcNow
                    }
                }
            };

            // Act
            var result = await service.ProcessBatchSyncAsync(request, Guid.NewGuid());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.ProcessedCount);
            Assert.Equal(0, result.DuplicateCount);

            var updatedAsset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(updatedAsset);
            Assert.Equal("In-Transit Outbound", updatedAsset.AssetState);
        }

        [Fact]
        public async Task ProcessBatchSyncAsync_ReturnConfirmation_UpdatesAssetStateToReturnedInWarehouse()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            db.Assets.Add(new Asset { Id = assetId, Name = "Speaker Stand", AssetState = "In-Transit Outbound" });
            db.Events.Add(new Event { Id = eventId, Name = "Gala Event", DateOfEvent = DateTime.Today });
            await db.SaveChangesAsync();

            var service = new OfflineSyncService(db);
            var request = new FieldReportSyncRequestDto
            {
                Items = new List<FieldReportSyncItemDto>
                {
                    new FieldReportSyncItemDto
                    {
                        ClientTxId = "tx-return-1",
                        EventType = "CONFIRM_RETURN",
                        EventId = eventId,
                        AssetId = assetId,
                        SubmittedAt = DateTime.UtcNow
                    }
                }
            };

            // Act
            var result = await service.ProcessBatchSyncAsync(request, Guid.NewGuid());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.ProcessedCount);

            var updatedAsset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(updatedAsset);
            Assert.Equal("Returned-In-Warehouse", updatedAsset.AssetState);
        }

        [Fact]
        public async Task ProcessBatchSyncAsync_DamageDeclaration_CreatesDamageReportAndDeficitQueue()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Assets.Add(new Asset { Id = assetId, Name = "Projector Lens", AssetState = "On-Site" });
            db.Events.Add(new Event { Id = eventId, Name = "Summit 2026", DateOfEvent = DateTime.Today });
            await db.SaveChangesAsync();

            var service = new OfflineSyncService(db);
            var request = new FieldReportSyncRequestDto
            {
                Items = new List<FieldReportSyncItemDto>
                {
                    new FieldReportSyncItemDto
                    {
                        ClientTxId = "tx-damage-1",
                        EventType = "DECLARE_DAMAGE",
                        EventId = eventId,
                        AssetId = assetId,
                        PayloadJson = "{\"damagedQuantity\": 2, \"severity\": \"Severe\", \"liabilityParty\": \"Venue\"}",
                        SubmittedAt = DateTime.UtcNow
                    }
                }
            };

            // Act
            var result = await service.ProcessBatchSyncAsync(request, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.ProcessedCount);

            var damageReport = await db.DamageReports.FirstOrDefaultAsync(d => d.AssetId == assetId && d.EventId == eventId);
            Assert.NotNull(damageReport);
            Assert.Equal(2, damageReport.DamagedQuantity);
            Assert.Equal("Severe", damageReport.Severity);

            var deficit = await db.DeficitQueue.FirstOrDefaultAsync(d => d.AssetId == assetId && d.EventId == eventId);
            Assert.NotNull(deficit);
            Assert.Equal(2, deficit.QuantityNeeded);
        }

        [Fact]
        public async Task ProcessBatchSyncAsync_DuplicateClientTxId_SkipsProcessingAndReturnsDuplicateStatus()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            db.FieldReportQueueItems.Add(new FieldReportQueueItem
            {
                Id = Guid.NewGuid(),
                ClientTxId = "tx-dup-123",
                EventType = "CONFIRM_OUTBOUND",
                EventId = eventId,
                AssetId = assetId,
                Status = "Processed",
                ProcessedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var service = new OfflineSyncService(db);
            var request = new FieldReportSyncRequestDto
            {
                Items = new List<FieldReportSyncItemDto>
                {
                    new FieldReportSyncItemDto
                    {
                        ClientTxId = "tx-dup-123",
                        EventType = "CONFIRM_OUTBOUND",
                        EventId = eventId,
                        AssetId = assetId
                    }
                }
            };

            // Act
            var result = await service.ProcessBatchSyncAsync(request, Guid.NewGuid());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.ProcessedCount);
            Assert.Equal(1, result.DuplicateCount);
            Assert.Equal("Duplicate", result.Results[0].Status);
        }
    }
}
