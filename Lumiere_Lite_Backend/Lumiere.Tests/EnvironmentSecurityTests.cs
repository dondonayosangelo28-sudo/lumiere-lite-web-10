using Lumiere.API.Controllers;
using Lumiere.Core.DTOs;
using Lumiere.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Lumiere.API";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    public class EnvironmentSecurityTests
    {
        [Fact]
        public async Task LoginDebug_InProduction_ReturnsNotFound()
        {
            // Arrange
            var testEnv = new TestHostEnvironment { EnvironmentName = Environments.Production };
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "ProductionSecurityTestDb")
                .Options;
            using var dbContext = new AppDbContext(options);

            var controller = new AuthController(null!, testEnv);
            var request = new LoginRequest { Email = "admin@lumiere.com", Password = "password" };

            // Act
            var result = await controller.LoginDebug(request, dbContext);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        public async Task Health_WithInMemoryDatabase_ReturnsDegraded503()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "HealthTestInMemoryDb")
                .Options;
            using var dbContext = new AppDbContext(options);

            var controller = new HealthController(dbContext);

            // Act
            var result = await controller.GetHealth();

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(503, statusResult.StatusCode);
        }
    }
}
