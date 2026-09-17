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
    public class VendorServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateVendorAsync_ValidVendorName_CreatesVendorRecord()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var service = new VendorService(db);
            var userId = Guid.NewGuid();

            var request = new CreateVendorRequest
            {
                Name = "Apex Audio Rentals",
                Address = "100 Soundwave Blvd"
            };

            // Act
            var vendorId = await service.CreateVendorAsync(request, userId);

            // Assert
            Assert.NotEqual(Guid.Empty, vendorId);
            var vendor = await db.Vendors.FindAsync(vendorId);
            Assert.NotNull(vendor);
            Assert.Equal("Apex Audio Rentals", vendor.VendorName);
        }

        [Fact]
        public async Task AddRepresentativeAsync_ValidVendor_AddsRepresentative()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var vendorId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            db.Vendors.Add(new Vendor { Id = vendorId, VendorName = "Starlight Rigging", Address = "42 Truss Lane" });
            await db.SaveChangesAsync();

            var service = new VendorService(db);

            var request = new AddRepresentativeRequest
            {
                FirstName = "John",
                LastName = "Doe"
            };

            // Act
            var repId = await service.AddRepresentativeAsync(vendorId, request, userId);

            // Assert
            Assert.NotEqual(Guid.Empty, repId);
            var rep = await db.VendorRepresentatives.FindAsync(repId);
            Assert.NotNull(rep);
            Assert.Equal("John Doe", rep.RepresentativeName);
            Assert.Equal(vendorId, rep.VendorId);
        }
    }
}
