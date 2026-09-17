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
    public class DeficitQueueServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task FlagDeficitAsync_ValidRequest_CreatesDeficitRecord()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Festival", DateOfEvent = DateTime.Today.AddDays(10), Status = "Active" });
            db.Assets.Add(new Asset { Id = assetId, Name = "Heavy Duty Cable", BaseCount = 50, AssetState = "Available" });
            await db.SaveChangesAsync();

            var service = new DeficitQueueService(db);

            var request = new CreateDeficitRequest
            {
                EventId = eventId,
                AssetId = assetId,
                QuantityNeeded = 5,
                Priority = "High",
                TriggerSource = "Planner Reservation Deficit"
            };

            // Act
            var deficitId = await service.FlagDeficitAsync(request, userId);

            // Assert
            Assert.NotEqual(Guid.Empty, deficitId);
            var deficit = await db.DeficitQueue.FindAsync(deficitId);
            Assert.NotNull(deficit);
            Assert.Equal(5, deficit.QuantityNeeded);
            Assert.Equal(DeficitStatus.NotPurchased, deficit.DeficitStatus);
            Assert.Equal("High", deficit.Priority);
        }

        [Fact]
        public async Task UpdateStatusAsync_SetStatusToReceived_SetsResolvedAtAndBy()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var deficitId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Expo", DateOfEvent = DateTime.Today.AddDays(7), Status = "Active" });
            db.DeficitQueue.Add(new DeficitQueue
            {
                Id = deficitId,
                EventId = eventId,
                QuantityNeeded = 10,
                DeficitStatus = DeficitStatus.NotPurchased,
                Priority = "Medium"
            });
            await db.SaveChangesAsync();

            var service = new DeficitQueueService(db);

            var updateRequest = new UpdateDeficitStatusRequest
            {
                Status = DeficitStatus.Received,
                PoRef = "PO-2026-99"
            };

            // Act
            await service.UpdateStatusAsync(deficitId, updateRequest, userId);

            // Assert
            var deficit = await db.DeficitQueue.FindAsync(deficitId);
            Assert.NotNull(deficit);
            Assert.Equal(DeficitStatus.Received, deficit.DeficitStatus);
            Assert.Equal("PO-2026-99", deficit.PoRef);
            Assert.Equal(userId, deficit.ResolvedBy);
            Assert.NotNull(deficit.ResolvedAt);
        }
    }
}
