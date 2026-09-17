using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Lumiere.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class EventServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateEventAsync_OmittedReturnDate_DefaultsToDateOfEvent()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var auditLogService = new AuditLogService(db);
            var eventService = new EventService(db, auditLogService);
            var userId = Guid.NewGuid();
            var eventDate = DateTime.UtcNow.Date.AddDays(10);

            var request = new CreateEventRequest
            {
                EventName = "Gala Concert 2026",
                EventVenue = "Grand Ballroom",
                IngressDate = eventDate,
                IngressTime = TimeSpan.FromHours(8),
                FullStop = TimeSpan.FromHours(22),
                DateOfEvent = eventDate,
                GeoClass = "National"
            };

            // Act
            var eventId = await eventService.CreateEventAsync(request, userId);

            // Assert
            Assert.NotEqual(Guid.Empty, eventId);

            var createdEvent = await db.Events.FindAsync(eventId);
            Assert.NotNull(createdEvent);
            Assert.Equal("Gala Concert 2026", createdEvent.Name);
            Assert.Equal(eventDate, createdEvent.DateOfEvent);
            Assert.Equal(eventDate, createdEvent.ReturnDate); // Auto-defaulted to DateOfEvent
            Assert.Equal(userId, createdEvent.CreatedBy);
        }
    }
}
