using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IDeficitQueueService
    {
        Task<Guid> FlagDeficitAsync(CreateDeficitRequest request, Guid currentUserId);
        Task<List<DeficitResponse>> GetDeficitsAsync(Guid? eventId, string? status);
        Task UpdateStatusAsync(Guid deficitId, UpdateDeficitStatusRequest request, Guid currentUserId);
    }
}
