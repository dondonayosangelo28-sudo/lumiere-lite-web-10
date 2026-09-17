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
    public class DamageReportServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task SubmitDamageReportAsync_DamagedQuantityGreaterThanZero_AutoEnqueuesDeficitRecord()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var assetId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Events.Add(new Event { Id = eventId, Name = "Wedding Gala", EventVenue = "Grand Hall", DateOfEvent = DateTime.Today.AddDays(5), Status = "Active" });
            db.Assets.Add(new Asset { Id = assetId, Name = "Stage Light Spot 500W", Description = "500W Moving Head Spot", BaseCount = 10, AssetState = "Prepping" });
            await db.SaveChangesAsync();

            var service = new DamageReportService(db);

            var request = new CreateDamageReportRequest
            {
                EventId = eventId,
                AssetId = assetId,
                DamagedQuantity = 2,
                PhotoUrl = "https://example.com/photo.jpg",
                Sha256Hash = "abc123hash",
                Severity = "Critical"
            };

            // Act
            var reportId = await service.SubmitDamageReportAsync(request, userId);

            // Assert
            Assert.NotEqual(Guid.Empty, reportId);

            var report = await db.DamageReports.FindAsync(reportId);
            Assert.NotNull(report);
            Assert.Equal(2, report.DamagedQuantity);

            // Verify auto-enqueued deficit queue entry
            var deficit = await db.DeficitQueue.FirstOrDefaultAsync(d => d.EventId == eventId && d.AssetId == assetId);
            Assert.NotNull(deficit);
            Assert.Equal(2, deficit.QuantityNeeded);
            Assert.Equal("Damage Report", deficit.TriggerSource);
            Assert.Equal("High", deficit.Priority);
        }
    }
}
