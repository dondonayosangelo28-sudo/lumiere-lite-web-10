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
    public class CanvasServiceTests
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
        public async Task SaveCanvasAsync_NewEvent_CreatesCanvasState()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Fashion Week", DateOfEvent = DateTime.Today.AddDays(7), Status = "Active" });
            await db.SaveChangesAsync();

            var service = new CanvasService(db, new FakeAuditLogService());

            var request = new SaveCanvasRequest
            {
                CanvasState = "{\"elements\": [{\"id\": \"pe-1\", \"type\": \"chair\", \"x\": 100, \"y\": 200}]}",
                AnnotationState = "{\"notes\": \"VIP Seating area\"}",
                CanvasMode = "Konva",
                CanvasStatus = "Draft"
            };

            // Act
            var result = await service.SaveCanvasAsync(eventId, request, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(eventId, result.EventId);
            Assert.Equal("Draft", result.CanvasStatus);
            Assert.Equal("Konva", result.CanvasMode);
            Assert.Contains("pe-1", result.CanvasState);

            var canvas = await db.EventCanvases.FirstOrDefaultAsync(c => c.EventId == eventId);
            Assert.NotNull(canvas);
            Assert.Equal(userId, canvas.SubmittedBy);
        }

        [Fact]
        public async Task ApproveCanvasAsync_ExistingCanvas_SetsStatusToApproved()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var plannerId = Guid.NewGuid();
            var canvasId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Gala Dinner", DateOfEvent = DateTime.Today.AddDays(10), Status = "Active" });
            db.EventCanvases.Add(new EventCanvas
            {
                Id = canvasId,
                EventId = eventId,
                CanvasState = "{\"stage\": \"Main Stage\"}",
                CanvasStatus = "Draft"
            });
            await db.SaveChangesAsync();

            var service = new CanvasService(db, new FakeAuditLogService());

            // Act
            var result = await service.ApproveCanvasAsync(eventId, plannerId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Approved", result.CanvasStatus);
            Assert.Equal(plannerId, result.ApprovedBy);
            Assert.NotNull(result.ApprovedAt);
        }
    }
}
