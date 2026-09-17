using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IReservationService
    {
        Task<BulkReservationResponse> ReserveAssetsBulkAsync(BulkReservationRequest request, Guid currentUserId);
        Task<List<ReservationResponse>> GetReservationsByEventAsync(Guid eventId);
        Task ReleaseReservationAsync(Guid reservationId, Guid currentUserId);
        Task<CanvasValidationResponse> ValidateCanvasStateAsync(CanvasValidationRequest request);
    }
}
