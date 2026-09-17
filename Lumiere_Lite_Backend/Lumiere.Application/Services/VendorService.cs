using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class VendorService : IVendorService
    {
        private readonly AppDbContext _context;

        public VendorService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> CreateVendorAsync(CreateVendorRequest request, Guid currentUserId)
        {
            if (await _context.Vendors.AnyAsync(v => v.VendorName == request.Name))
                throw new InvalidOperationException("Vendor with this name already exists.");

            var vendor = new Vendor
            {
                VendorName = request.Name,
                Address = request.Address
            };

            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();

            return vendor.Id;
        }

        public async Task<Guid> AddRepresentativeAsync(Guid vendorId, AddRepresentativeRequest request, Guid currentUserId)
        {
            var vendor = await _context.Vendors.FindAsync(vendorId);
            if (vendor == null) throw new KeyNotFoundException("Vendor not found.");

            var rep = new VendorRepresentative
            {
                VendorId = vendorId,
                RepresentativeName = $"{request.FirstName} {request.LastName}".Trim(),
                IsPrimary = false
            };

            _context.VendorRepresentatives.Add(rep);
            await _context.SaveChangesAsync();

            return rep.Id;
        }

        public async Task AddContactNumberAsync(Guid vendorId, Guid repId, AddContactRequest request, Guid currentUserId)
        {
            var rep = await _context.VendorRepresentatives.FirstOrDefaultAsync(r => r.Id == repId && r.VendorId == vendorId);
            if (rep == null) throw new KeyNotFoundException("Representative not found for this vendor.");

            var contact = new VendorContactNumber
            {
                RepresentativeId = repId,
                ContactNumber = request.PhoneNumber,
                NumberLabel = request.Type
            };

            _context.VendorContactNumbers.Add(contact);
            await _context.SaveChangesAsync();
        }

        public async Task AddPlatformAsync(Guid vendorId, Guid repId, AddPlatformRequest request, Guid currentUserId)
        {
            var rep = await _context.VendorRepresentatives.FirstOrDefaultAsync(r => r.Id == repId && r.VendorId == vendorId);
            if (rep == null) throw new KeyNotFoundException("Representative not found for this vendor.");

            var platform = new VendorContactPlatform
            {
                RepresentativeId = repId,
                PlatformType = request.PlatformName,
                PlatformValue = request.Handle
            };

            _context.VendorContactPlatforms.Add(platform);
            await _context.SaveChangesAsync();
        }

        public async Task LinkAssetVendorAsync(Guid assetId, LinkVendorAssetRequest request, Guid currentUserId)
        {
            var asset = await _context.Assets.FindAsync(assetId);
            if (asset == null) throw new KeyNotFoundException("Asset not found.");

            var vendor = await _context.Vendors.FindAsync(request.VendorId);
            if (vendor == null) throw new KeyNotFoundException("Vendor not found.");

            var link = new AssetVendor
            {
                AssetId = assetId,
                VendorId = request.VendorId,
                RentalCost = request.RentalPrice
            };

            _context.AssetVendors.Add(link);
            await _context.SaveChangesAsync();
        }

        public async Task<List<VendorResponse>> GetVendorsAsync()
        {
            var vendors = await _context.Vendors
                .Include(v => v.Representatives)
                .OrderBy(v => v.VendorName)
                .ToListAsync();

            return vendors.Select(v => new VendorResponse
            {
                Id = v.Id,
                Name = v.VendorName,
                Address = v.Address,
                Representatives = v.Representatives.Select(r => new RepresentativeDto
                {
                    Id = r.Id,
                    FirstName = r.RepresentativeName.Split(' ').FirstOrDefault() ?? string.Empty,
                    LastName = string.Join(" ", r.RepresentativeName.Split(' ').Skip(1))
                }).ToList()
            }).ToList();
        }
    }
}
