using Lumiere.Core.DTOs;
using System;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IEventService
    {
        Task<Guid> CreateEventAsync(CreateEventRequest request, Guid currentUserId);
        Task<PaginatedList<EventResponse>> GetEventsAsync(int page, int pageSize, string? statusFilter);
        Task<EventResponse> GetEventByIdAsync(Guid eventId);
        Task AcknowledgeLossMakerAsync(Guid eventId, Guid currentUserId);
        Task UpdateEventAsync(Guid eventId, UpdateEventRequest request, Guid currentUserId);
        Task GrantCanvasAccessAsync(Guid eventId, GrantCanvasAccessRequest request, Guid grantingUserId);
        Task ModifyCanvasAccessAsync(Guid eventId, Guid targetUserId, ModifyCanvasAccessRequest request, Guid modifyingUserId);
        Task RevokeCanvasAccessAsync(Guid eventId, Guid targetUserId, Guid revokingUserId);
        Task<System.Collections.Generic.List<EventViewerResponse>> GetActiveCanvasViewersAsync(Guid eventId);
    }
}
