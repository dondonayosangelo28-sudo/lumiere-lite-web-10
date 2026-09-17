using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;

namespace Lumiere.Application.Services
{
    public interface IOfflineSyncService
    {
        Task<BatchSyncResultDto> ProcessBatchSyncAsync(FieldReportSyncRequestDto dto, Guid performingUserId);
        Task<IEnumerable<FieldReportSyncItemDto>> GetPendingItemsForUserAsync(Guid userId);
    }
}
