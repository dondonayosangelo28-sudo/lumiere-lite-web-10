using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;

namespace Lumiere.Application.Services
{
    public interface IProductionService
    {
        Task<GanttScheduleResponseDto> GetGanttScheduleForEventAsync(Guid eventId);
        Task<ProductionTaskResponseDto> CreateTaskAsync(ProductionTaskRequestDto dto);
        Task<ProductionTaskResponseDto> UpdateProgressAsync(Guid taskId, UpdateProgressRequestDto dto);
        Task<ProductionQuotaDto> SetQuotaAsync(ProductionQuotaDto dto);
        Task<IEnumerable<ProductionQuotaDto>> GetQuotasAsync();
    }
}
