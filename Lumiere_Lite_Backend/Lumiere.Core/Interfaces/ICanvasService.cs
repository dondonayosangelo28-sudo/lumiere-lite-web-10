using Lumiere.Core.DTOs;
using System;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface ICanvasService
    {
        Task<CanvasResponse?> GetCanvasByEventIdAsync(Guid eventId);
        Task<CanvasResponse> SaveCanvasAsync(Guid eventId, SaveCanvasRequest request, Guid currentUserId);
        Task<CanvasResponse> ApproveCanvasAsync(Guid eventId, Guid currentUserId);
    }
}
