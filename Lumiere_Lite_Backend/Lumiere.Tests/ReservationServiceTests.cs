using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class ReservationServiceTests
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
        public async Task ReserveAssetsBulkAsync_ValidRequest_CreatesReservationsAndCommitsAssets()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Grand Gala", DateOfEvent = DateTime.Today.AddDays(5), Status = "Active", GeoClass = "Local" });
            db.Assets.Add(new Asset { Id = assetId, Name = "Digital Audio Console", BaseCount = 2, AssetState = "Available" });
            await db.SaveChangesAsync();

            var service = new ReservationService(db, null!);

            var request = new BulkReservationRequest
            {
                EventId = eventId,
                AssetIds = new List<Guid> { assetId },
                LockStart = DateTimeOffset.UtcNow.AddDays(1),
                LockEnd = DateTimeOffset.UtcNow.AddDays(3)
            };

            // Act
            var response = await service.ReserveAssetsBulkAsync(request, userId);

            // Assert
            Assert.NotEmpty(response.ReservationIds);
            var asset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(asset);
            Assert.Equal("Committed", asset.AssetState);
        }

        [Fact]
        public async Task ValidateCanvasStateAsync_ConflictingOverlaps_ReturnsConflictedAssetIds()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();

            db.AssetReservations.Add(new AssetReservation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                AssetId = assetId,
                LockStart = DateTimeOffset.UtcNow.AddDays(-1),
                LockEnd = DateTimeOffset.UtcNow.AddDays(5),
                Status = "Committed"
            });
            await db.SaveChangesAsync();

            var service = new ReservationService(db, null!);

            var request = new CanvasValidationRequest
            {
                EventId = eventId,
                AssetIds = new List<Guid> { assetId },
                LockStart = DateTimeOffset.UtcNow,
                LockEnd = DateTimeOffset.UtcNow.AddDays(2)
            };

            // Act
            var result = await service.ValidateCanvasStateAsync(request);

            // Assert
            Assert.Contains(assetId, result.ConflictedAssetIds);
            Assert.DoesNotContain(assetId, result.AvailableAssetIds);
        }
    }
}
