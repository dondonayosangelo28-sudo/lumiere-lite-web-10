using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class DispatchServiceTests
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
        public async Task PrepareDispatchAsync_CommittedReservations_TransitionsToPrepping()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Gala Night", EventVenue = "Main Stage", DateOfEvent = DateTime.Today.AddDays(3), Status = "Active" });
            db.Assets.Add(new Asset { Id = assetId, Name = "LED Wall Panel", BaseCount = 20, AssetState = "Committed" });
            db.AssetReservations.Add(new AssetReservation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                AssetId = assetId,
                Status = "Confirmed"
            });
            await db.SaveChangesAsync();

            var service = new DispatchService(db, null!);

            // Act
            await service.PrepareDispatchAsync(eventId, userId);

            // Assert
            var asset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(asset);
            Assert.Equal("Prepping", asset.AssetState);

            var queue = await db.DispatchPreparationQueue.FirstOrDefaultAsync(q => q.EventId == eventId);
            Assert.NotNull(queue);
            Assert.Equal("Prepping", queue.PrepStatus);
        }

        [Fact]
        public async Task VerifyItemAsync_PreppingAsset_TransitionsToInTransitOutbound()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Concert", EventVenue = "Arena", DateOfEvent = DateTime.Today.AddDays(2), Status = "Active" });
            db.Assets.Add(new Asset { Id = assetId, Name = "Speakers", BaseCount = 4, AssetState = "Prepping" });
            db.AssetReservations.Add(new AssetReservation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                AssetId = assetId,
                Status = "Confirmed"
            });
            db.DispatchPreparationQueue.Add(new DispatchPreparationQueue
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                AssetId = assetId,
                QuantityRequired = 4,
                PrepStatus = "Prepping"
            });
            await db.SaveChangesAsync();

            var service = new DispatchService(db, null!);

            // Act
            var result = await service.VerifyItemAsync(eventId, assetId, userId);

            // Assert
            Assert.True(result.IsBatchComplete);

            var asset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(asset);
            Assert.Equal("In-Transit Outbound", asset.AssetState);

            var queue = await db.DispatchPreparationQueue.FirstOrDefaultAsync(q => q.EventId == eventId);
            Assert.NotNull(queue);
            Assert.Equal("Dispatched", queue.PrepStatus);
        }

        [Fact]
        public async Task UpdateAssetStateAtomicAsync_ValidLifecycleSequence_TransitionsState()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Assets.Add(new Asset { Id = assetId, Name = "Truss Tower", BaseCount = 8, AssetState = "In-Transit Outbound" });
            await db.SaveChangesAsync();

            var service = new DispatchService(db, null!);

            // Act & Assert 1: In-Transit Outbound -> On-Site
            await service.UpdateAssetStateAtomicAsync(assetId, "On-Site", userId);
            var asset = await db.Assets.FindAsync(assetId);
            Assert.Equal("On-Site", asset!.AssetState);

            // Act & Assert 2: On-Site -> In-Transit Return
            await service.UpdateAssetStateAtomicAsync(assetId, "In-Transit Return", userId);
            Assert.Equal("In-Transit Return", asset.AssetState);

            // Act & Assert 3: In-Transit Return -> Pending Count
            await service.UpdateAssetStateAtomicAsync(assetId, "Pending Count", userId);
            Assert.Equal("Pending Count", asset.AssetState);

            // Act & Assert 4: Pending Count -> Available Unprepped
            await service.UpdateAssetStateAtomicAsync(assetId, "Available Unprepped", userId);
            Assert.Equal("Available Unprepped", asset.AssetState);
        }
    }
}
