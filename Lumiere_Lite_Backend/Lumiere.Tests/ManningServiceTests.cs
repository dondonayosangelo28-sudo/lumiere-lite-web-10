using System;
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
    public class ManningServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task AssignCrewAsync_ValidAssignment_Succeeds()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var performingUserId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Summit 2026", DateOfEvent = DateTime.Today.AddDays(5), Status = "Active" });
            db.Users.Add(new User { Id = userId, FullName = "John Crew", Email = "john@lumiere.com", IsActive = true });
            await db.SaveChangesAsync();

            var service = new ManningService(db);
            var dto = new AssignCrewRequestDto
            {
                EventId = eventId,
                UserId = userId,
                RoleName = "Lead Installer",
                ShiftDate = DateTime.Today.AddDays(5),
                ShiftStartTime = new TimeSpan(8, 0, 0),
                ShiftEndTime = new TimeSpan(17, 0, 0),
                Notes = "Primary setup team",
                IsOverride = false
            };

            // Act
            var result = await service.AssignCrewAsync(dto, performingUserId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(eventId, result.EventId);
            Assert.Equal("Summit 2026", result.EventName);
            Assert.Equal(userId, result.UserId);
            Assert.Equal("John Crew", result.UserName);
            Assert.Equal("Lead Installer", result.RoleName);
            Assert.False(result.IsOverride);

            var saved = await db.ManningAssignments.FirstOrDefaultAsync(m => m.Id == result.Id);
            Assert.NotNull(saved);
        }

        [Fact]
        public async Task AssignCrewAsync_DoubleBookingWithoutOverride_ThrowsInvalidOperationException()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var event1Id = Guid.NewGuid();
            var event2Id = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var shiftDate = DateTime.Today.AddDays(10);

            db.Events.Add(new Event { Id = event1Id, Name = "Gala A", DateOfEvent = shiftDate, Status = "Active" });
            db.Events.Add(new Event { Id = event2Id, Name = "Concert B", DateOfEvent = shiftDate, Status = "Active" });
            db.Users.Add(new User { Id = userId, FullName = "Alice Driver", Email = "alice@lumiere.com", IsActive = true });

            db.ManningAssignments.Add(new ManningAssignment
            {
                Id = Guid.NewGuid(),
                EventId = event1Id,
                UserId = userId,
                RoleName = "Logistics Driver",
                ShiftDate = shiftDate
            });
            await db.SaveChangesAsync();

            var service = new ManningService(db);
            var dto = new AssignCrewRequestDto
            {
                EventId = event2Id,
                UserId = userId,
                RoleName = "Stage Hand",
                ShiftDate = shiftDate,
                IsOverride = false
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.AssignCrewAsync(dto, Guid.NewGuid()));
            Assert.Contains("already assigned to event 'Gala A'", ex.Message);
            Assert.Contains("Double-booking requires an explicit override", ex.Message);
        }

        [Fact]
        public async Task AssignCrewAsync_DoubleBookingWithOverride_SucceedsAndLogsAudit()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var event1Id = Guid.NewGuid();
            var event2Id = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var performingUserId = Guid.NewGuid();
            var shiftDate = DateTime.Today.AddDays(12);

            db.Events.Add(new Event { Id = event1Id, Name = "Exhibition A", DateOfEvent = shiftDate, Status = "Active" });
            db.Events.Add(new Event { Id = event2Id, Name = "Fashion B", DateOfEvent = shiftDate, Status = "Active" });
            db.Users.Add(new User { Id = userId, FullName = "Bob Tech", Email = "bob@lumiere.com", IsActive = true });

            db.ManningAssignments.Add(new ManningAssignment
            {
                Id = Guid.NewGuid(),
                EventId = event1Id,
                UserId = userId,
                RoleName = "AV Tech",
                ShiftDate = shiftDate
            });
            await db.SaveChangesAsync();

            var service = new ManningService(db);
            var dto = new AssignCrewRequestDto
            {
                EventId = event2Id,
                UserId = userId,
                RoleName = "Lighting Tech",
                ShiftDate = shiftDate,
                IsOverride = true
            };

            // Act
            var result = await service.AssignCrewAsync(dto, performingUserId);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.IsOverride);

            var audit = await db.AuditLogs.FirstOrDefaultAsync(a => a.ActionType == "DOUBLE_BOOKING_OVERRIDE");
            Assert.NotNull(audit);
            Assert.Equal(performingUserId, audit.ActorId);
            Assert.Equal(result.Id, audit.AffectedRecordId);
        }

        [Fact]
        public async Task GetAssignmentsForEventAsync_ReturnsEventAssignments()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var user1Id = Guid.NewGuid();
            var user2Id = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Expo 2026", DateOfEvent = DateTime.Today, Status = "Active" });
            db.Users.Add(new User { Id = user1Id, FullName = "Crew Member 1", Email = "c1@lumiere.com", IsActive = true });
            db.Users.Add(new User { Id = user2Id, FullName = "Crew Member 2", Email = "c2@lumiere.com", IsActive = true });

            db.ManningAssignments.Add(new ManningAssignment { Id = Guid.NewGuid(), EventId = eventId, UserId = user1Id, RoleName = "Lead", ShiftDate = DateTime.Today });
            db.ManningAssignments.Add(new ManningAssignment { Id = Guid.NewGuid(), EventId = eventId, UserId = user2Id, RoleName = "Support", ShiftDate = DateTime.Today });
            await db.SaveChangesAsync();

            var service = new ManningService(db);

            // Act
            var results = (await service.GetAssignmentsForEventAsync(eventId)).ToList();

            // Assert
            Assert.Equal(2, results.Count);
            Assert.Contains(results, r => r.UserId == user1Id);
            Assert.Contains(results, r => r.UserId == user2Id);
        }

        [Fact]
        public async Task RemoveAssignmentAsync_ExistingAssignment_DeletesSuccessfully()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var assignmentId = Guid.NewGuid();

            db.ManningAssignments.Add(new ManningAssignment
            {
                Id = assignmentId,
                EventId = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                RoleName = "Rigger",
                ShiftDate = DateTime.Today
            });
            await db.SaveChangesAsync();

            var service = new ManningService(db);

            // Act
            var deleted = await service.RemoveAssignmentAsync(assignmentId, Guid.NewGuid());

            // Assert
            Assert.True(deleted);
            var exists = await db.ManningAssignments.AnyAsync(m => m.Id == assignmentId);
            Assert.False(exists);
        }
    }
}
