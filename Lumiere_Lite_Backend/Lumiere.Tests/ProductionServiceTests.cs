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
    public class ProductionServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateTaskAsync_ValidTask_Succeeds()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            db.Events.Add(new Event { Id = eventId, Name = "Gala Production", DateOfEvent = DateTime.Today, Status = "Active" });
            await db.SaveChangesAsync();

            var service = new ProductionService(db);
            var dto = new ProductionTaskRequestDto
            {
                EventId = eventId,
                TaskName = "Build Custom Backdrop",
                Category = "Carpentry",
                TargetQuantity = 10,
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(3)
            };

            // Act
            var result = await service.CreateTaskAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(eventId, result.EventId);
            Assert.Equal("Build Custom Backdrop", result.TaskName);
            Assert.Equal("Carpentry", result.Category);
            Assert.Equal(10, result.TargetQuantity);
            Assert.Equal(0, result.CompletedQuantity);
            Assert.Equal(0m, result.ProgressPercentage);
            Assert.Equal("Pending", result.Status);
        }

        [Fact]
        public async Task UpdateProgressAsync_PartialQuantity_CalculatesPercentageAndSetsInProgress()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var taskId = Guid.NewGuid();
            db.Events.Add(new Event { Id = eventId, Name = "Metalwork Event", DateOfEvent = DateTime.Today });
            db.ProductionTasks.Add(new ProductionTask
            {
                Id = taskId,
                EventId = eventId,
                TaskName = "Weld Metal Frames",
                Category = "Metalwork",
                TargetQuantity = 20,
                CompletedQuantity = 0,
                ProgressPercentage = 0m,
                Status = "Pending"
            });
            await db.SaveChangesAsync();

            var service = new ProductionService(db);

            // Act
            var result = await service.UpdateProgressAsync(taskId, new UpdateProgressRequestDto { CompletedQuantity = 5 });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(5, result.CompletedQuantity);
            Assert.Equal(25.00m, result.ProgressPercentage);
            Assert.Equal("In-Progress", result.Status);
        }

        [Fact]
        public async Task UpdateProgressAsync_FullQuantity_SetsStatusToCompleted()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            var taskId = Guid.NewGuid();
            db.Events.Add(new Event { Id = eventId, Name = "Paint Event", DateOfEvent = DateTime.Today });
            db.ProductionTasks.Add(new ProductionTask
            {
                Id = taskId,
                EventId = eventId,
                TaskName = "Paint Panels",
                Category = "Paint",
                TargetQuantity = 50,
                CompletedQuantity = 10,
                ProgressPercentage = 20m,
                Status = "In-Progress"
            });
            await db.SaveChangesAsync();

            var service = new ProductionService(db);

            // Act
            var result = await service.UpdateProgressAsync(taskId, new UpdateProgressRequestDto { CompletedQuantity = 50 });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(50, result.CompletedQuantity);
            Assert.Equal(100.00m, result.ProgressPercentage);
            Assert.Equal("Completed", result.Status);
        }

        [Fact]
        public async Task GetGanttScheduleForEventAsync_ReturnsTasksAndOverallProgress()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var eventId = Guid.NewGuid();
            db.Events.Add(new Event { Id = eventId, Name = "Fashion Showcase", DateOfEvent = DateTime.Today, Status = "Active" });

            db.ProductionTasks.Add(new ProductionTask
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                TaskName = "Task 1",
                Category = "Carpentry",
                TargetQuantity = 10,
                CompletedQuantity = 10,
                ProgressPercentage = 100m,
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(2),
                Status = "Completed"
            });

            db.ProductionTasks.Add(new ProductionTask
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                TaskName = "Task 2",
                Category = "Assembly",
                TargetQuantity = 30,
                CompletedQuantity = 10,
                ProgressPercentage = 33.33m,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(4),
                Status = "In-Progress"
            });

            await db.SaveChangesAsync();

            var service = new ProductionService(db);

            // Act
            var schedule = await service.GetGanttScheduleForEventAsync(eventId);

            // Assert
            Assert.NotNull(schedule);
            Assert.Equal(eventId, schedule.EventId);
            Assert.Equal("Fashion Showcase", schedule.EventName);
            Assert.Equal(2, schedule.Tasks.Count);
            // Overall progress: 20 completed out of 40 target = 50.00%
            Assert.Equal(50.00m, schedule.OverallProgressPercentage);
        }

        [Fact]
        public async Task SetQuotaAsync_And_GetQuotasAsync_ManagesDepartmentQuotas()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var service = new ProductionService(db);

            // Act
            var createdQuota = await service.SetQuotaAsync(new ProductionQuotaDto
            {
                Department = "Carpentry",
                DailyTargetUnits = 15,
                EffectiveDate = DateTime.Today,
                Notes = "Q3 Target"
            });

            var quotas = (await service.GetQuotasAsync()).ToList();

            // Assert
            Assert.NotNull(createdQuota);
            Assert.Equal("Carpentry", createdQuota.Department);
            Assert.Equal(15, createdQuota.DailyTargetUnits);

            Assert.Single(quotas);
            Assert.Equal("Carpentry", quotas[0].Department);
        }
    }
}
