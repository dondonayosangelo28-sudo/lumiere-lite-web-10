using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class EphemeralPermissionServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
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
        public async Task GrantPermissionAsync_ValidRequest_CreatesEphemeralGrant()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var targetUserId = Guid.NewGuid();
            var tempRoleId = Guid.NewGuid();
            var granterUserId = Guid.NewGuid();

            db.Users.Add(new User { Id = targetUserId, Email = "crew@lumiere.com", FullName = "Crew Member", PasswordHash = "hash", RoleId = tempRoleId, IsActive = true });
            db.Roles.Add(new Role { Id = tempRoleId, Name = "Warehouse Operations Manager", Description = "Temp Role" });
            await db.SaveChangesAsync();

            var service = new EphemeralPermissionService(db, new FakeAuditLogService());

            var request = new GrantEphemeralPermissionRequest
            {
                TargetUserId = targetUserId,
                TempRoleId = tempRoleId,
                StartTimestamp = DateTime.UtcNow,
                EndTimestamp = DateTime.UtcNow.AddHours(4),
                AuthReason = "Emergency shift cover"
            };

            // Act
            var permId = await service.GrantPermissionAsync(request, granterUserId);

            // Assert
            Assert.NotEqual(Guid.Empty, permId);
            var perm = await db.EphemeralPermissions.FindAsync(permId);
            Assert.NotNull(perm);
            Assert.Equal("Emergency shift cover", perm.AuthReason);
        }

        [Fact]
        public async Task RevokePermissionAsync_ValidPermission_SetsEndTimestampToNow()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var permId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.EphemeralPermissions.Add(new EphemeralPermission
            {
                Id = permId,
                UserId = Guid.NewGuid(),
                TempRoleId = Guid.NewGuid(),
                StartTimestamp = DateTime.UtcNow.AddHours(-1),
                EndTimestamp = DateTime.UtcNow.AddHours(5),
                AuthReason = "Temporary coverage"
            });
            await db.SaveChangesAsync();

            var service = new EphemeralPermissionService(db, new FakeAuditLogService());

            // Act
            await service.RevokePermissionAsync(permId, userId);

            // Assert
            var perm = await db.EphemeralPermissions.FindAsync(permId);
            Assert.NotNull(perm);
            Assert.True(perm.EndTimestamp <= DateTime.UtcNow);
        }
    }
}
