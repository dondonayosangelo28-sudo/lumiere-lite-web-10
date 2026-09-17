using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IVendorService
    {
        Task<Guid> CreateVendorAsync(CreateVendorRequest request, Guid currentUserId);
        Task<Guid> AddRepresentativeAsync(Guid vendorId, AddRepresentativeRequest request, Guid currentUserId);
        Task AddContactNumberAsync(Guid vendorId, Guid repId, AddContactRequest request, Guid currentUserId);
        Task AddPlatformAsync(Guid vendorId, Guid repId, AddPlatformRequest request, Guid currentUserId);
        Task LinkAssetVendorAsync(Guid assetId, LinkVendorAssetRequest request, Guid currentUserId);
        Task<List<VendorResponse>> GetVendorsAsync();
    }
}
