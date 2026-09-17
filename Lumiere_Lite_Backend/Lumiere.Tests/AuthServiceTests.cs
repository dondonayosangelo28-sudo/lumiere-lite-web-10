using Lumiere.Application.Services;
using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class AuthServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private IMemoryCache GetMemoryCache()
        {
            return new MemoryCache(new MemoryCacheOptions());
        }

        private IConfiguration GetTestConfiguration()
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Jwt:Secret", "SuperSecretKeyForLumiereTest1234567890!" },
                    { "Jwt:Issuer", "LumiereAPI" },
                    { "Jwt:Audience", "LumiereApp" }
                })
                .Build();
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var cache = GetMemoryCache();
            var config = GetTestConfiguration();

            var role = new Role { Id = Guid.NewGuid(), Name = "Warehouse Operations Manager", Description = "Warehouse Ops" };
            db.Roles.Add(role);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Maya Lin",
                Email = "maya@lumiere.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                RoleId = role.Id,
                Role = role,
                IsActive = true
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var jwtService = new JwtService(config, cache, db);
            var authService = new AuthService(db, jwtService, cache);

            var request = new LoginRequest { Email = "maya@lumiere.com", Password = "Password123!" };

            // Act
            var response = await authService.LoginAsync(request);

            // Assert
            Assert.NotNull(response);
            Assert.Equal("maya@lumiere.com", response.Email);
            Assert.Equal("Maya Lin", response.FullName);
            Assert.False(string.IsNullOrEmpty(response.Token));
        }

        [Fact]
        public async Task LoginAsync_InactiveUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var cache = GetMemoryCache();
            var config = GetTestConfiguration();

            var role = new Role { Id = Guid.NewGuid(), Name = "Ground Crew", Description = "Field Crew" };
            db.Roles.Add(role);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Inactive Crew",
                Email = "inactive@lumiere.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                RoleId = role.Id,
                Role = role,
                IsActive = false
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var jwtService = new JwtService(config, cache, db);
            var authService = new AuthService(db, jwtService, cache);

            var request = new LoginRequest { Email = "inactive@lumiere.com", Password = "Password123!" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_FiveFailedAttempts_TriggersAccountLockout()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var cache = GetMemoryCache();
            var config = GetTestConfiguration();

            var jwtService = new JwtService(config, cache, db);
            var authService = new AuthService(db, jwtService, cache);
            var request = new LoginRequest { Email = "testlockout@lumiere.com", Password = "WrongPassword" };

            // Act: Fail 5 times
            for (int i = 0; i < 5; i++)
            {
                await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
            }

            // Assert: 6th attempt throws lockout exception
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
            Assert.Contains("locked due to too many failed login attempts", ex.Message);
        }
    }
}
