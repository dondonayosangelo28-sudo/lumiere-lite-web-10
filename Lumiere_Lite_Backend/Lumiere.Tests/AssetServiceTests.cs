using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class AssetServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            return new AppDbContext(options);
        }

        private class FakeAuditLogService : IAuditLogService
        {
            public Task LogAsync(Guid? actorId, string actionType, string affectedTable, Guid affectedRecordId, object? previousState, object? newState)
            {
                return Task.CompletedTask;
            }
        }

        [Fact]
        public async Task CreateAssetAsync_ValidRole_CreatesAsset()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var service = new AssetService(db, new FakeAuditLogService(), null!);
            var userId = Guid.NewGuid();

            var request = new CreateAssetRequest
            {
                Name = "Projector 4K 10000 Lumens",
                Description = "High brightness venue projector",
                AssetTier = 1,
                Quantity = 2,
                CatalogPhotoUrl = "https://example.com/projector.png"
            };

            var roles = new List<string> { "Warehouse Operations Manager" };

            // Act
            var assetId = await service.CreateAssetAsync(request, userId, roles);

            // Assert
            Assert.NotEqual(Guid.Empty, assetId);
            var asset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(asset);
            Assert.Equal("Projector 4K 10000 Lumens", asset.Name);
            Assert.Equal("Available", asset.AssetState);
        }

        [Fact]
        public async Task TransitionStateAsync_PreppingToInTransitOutbound_Succeeds()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Assets.Add(new Asset
            {
                Id = assetId,
                Name = "Stage Truss Section",
                BaseCount = 4,
                AssetState = "Prepping"
            });
            await db.SaveChangesAsync();

            var service = new AssetService(db, new FakeAuditLogService(), null!);

            var request = new TransitionStateRequest
            {
                TargetState = "In-Transit Outbound"
            };

            // Act
            await service.TransitionStateAsync(assetId, request, userId, isSupervisor: false);

            // Assert
            var asset = await db.Assets.FindAsync(assetId);
            Assert.NotNull(asset);
            Assert.Equal("In-Transit Outbound", asset.AssetState);
        }
    }
}
