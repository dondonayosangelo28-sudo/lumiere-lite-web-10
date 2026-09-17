using Lumiere.Application.Services;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Supabase;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Lumiere.Tests
{
    public class AssetImportServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task ImportAssetsPhase1Async_ValidCsv_CreatesAssetRecords()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var subTypeId = Guid.NewGuid();
            db.AssetSubTypes.Add(new AssetSubType { Id = subTypeId, Name = "Truss 3m" });
            await db.SaveChangesAsync();

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
            var httpClient = new HttpClient();
            var bgService = new BackgroundRemovalService(httpClient, config, NullLogger<BackgroundRemovalService>.Instance);
            var supabaseClient = new Client("https://placeholder.supabase.co", "placeholder-key");

            var importService = new AssetImportService(db, bgService, NullLogger<AssetImportService>.Instance, supabaseClient);

            var csvContent = $"AssetSubTypeId,Name,Description,AssetTier,Quantity\n{subTypeId},Modular Truss,3m Aluminium Truss,1,10\n";
            using var csvStream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

            // Act
            var createdIds = await importService.ImportAssetsPhase1Async(csvStream, Guid.NewGuid());

            // Assert
            Assert.Single(createdIds);
            var asset = await db.Assets.FindAsync(createdIds[0]);
            Assert.NotNull(asset);
            Assert.Equal("Modular Truss", asset.Name);
            Assert.Equal(10, asset.BaseCount);
            Assert.Equal("Available", asset.AssetState);
        }

        [Fact]
        public async Task ImportAssetsPhase1Async_Exceeds75Items_ThrowsInvalidOperationException()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
            var httpClient = new HttpClient();
            var bgService = new BackgroundRemovalService(httpClient, config, NullLogger<BackgroundRemovalService>.Instance);
            var supabaseClient = new Client("https://placeholder.supabase.co", "placeholder-key");

            var importService = new AssetImportService(db, bgService, NullLogger<AssetImportService>.Instance, supabaseClient);

            var sb = new StringBuilder();
            sb.AppendLine("AssetSubTypeId,Name,Description,AssetTier,Quantity");
            for (int i = 0; i < 76; i++)
            {
                sb.AppendLine($"{Guid.NewGuid()},Asset {i},Description {i},1,5");
            }

            using var csvStream = new MemoryStream(Encoding.UTF8.GetBytes(sb.ToString()));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => importService.ImportAssetsPhase1Async(csvStream, Guid.NewGuid()));
        }
    }
}
