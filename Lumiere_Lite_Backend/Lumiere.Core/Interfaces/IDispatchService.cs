using Lumiere.Core.DTOs;
using System;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IDispatchService
    {
        Task<PackingListResponse> GetPackingListAsync(Guid eventId);
        Task PrepareDispatchAsync(Guid eventId, Guid currentUserId);
        Task<VerifyItemResponse> VerifyItemAsync(Guid eventId, Guid assetId, Guid currentUserId);
        Task ForceDispatchAsync(Guid eventId, Guid currentUserId);
        Task UpdateAssetStateAtomicAsync(Guid assetId, string targetState, Guid actorId, Guid? eventId = null);
    }
}
