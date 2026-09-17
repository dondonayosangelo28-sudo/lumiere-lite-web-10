using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IAssetService
    {
        Task<Guid> CreateAssetAsync(CreateAssetRequest request, Guid currentUserId, List<string> userRoles);
        Task<PaginatedList<AssetResponse>> GetAssetsAsync(int page, int pageSize, int? tier, string? state, Guid? assetTypeId, string? tagValue, string? hexValue);
        Task<AssetDetailResponse> GetAssetByIdAsync(Guid assetId);
        Task UpdateAssetAsync(Guid assetId, UpdateAssetRequest request, Guid currentUserId);
        Task AddColorAsync(Guid assetId, AddColorRequest request, Guid currentUserId);
        Task AddTagAsync(Guid assetId, AddTagRequest request, Guid currentUserId);
        Task TransitionStateAsync(Guid assetId, TransitionStateRequest request, Guid currentUserId, bool isSupervisor);
        Task SalvageAssetAsync(Guid assetId, SalvageAssetRequest request, Guid currentUserId, bool isSupervisor);
    }
}
