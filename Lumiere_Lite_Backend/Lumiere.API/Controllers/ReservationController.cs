using Lumiere.Core.DTOs;
using Lumiere.Core.Interfaces;
using Lumiere.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/reservations")]
    [Authorize]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _reservationService;
        private readonly ICurrentUserService _currentUserService;

        public ReservationController(IReservationService reservationService, ICurrentUserService currentUserService)
        {
            _reservationService = reservationService;
            _currentUserService = currentUserService;
        }

        [HttpPost("bulk")]
        [RequireCanvasAccess("CO_EDIT")]
        public async Task<IActionResult> ReserveAssetsBulk([FromBody] BulkReservationRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var response = await _reservationService.ReserveAssetsBulkAsync(request, currentUserId);
                return Created("/api/reservations/bulk", response);
            }
            catch (TemporalConflictException ex)
            {
                return Conflict(new { Message = ex.Message, Conflicts = ex.Conflicts });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpGet("event/{eventId}")]
        [RequireCanvasAccess("VIEW")]
        public async Task<IActionResult> GetReservationsByEvent(Guid eventId)
        {
            var reservations = await _reservationService.GetReservationsByEventAsync(eventId);
            return Ok(reservations);
        }

        [HttpDelete("{reservationId}")]
        [RequireCanvasAccess("CO_EDIT")]
        public async Task<IActionResult> ReleaseReservation(Guid reservationId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _reservationService.ReleaseReservationAsync(reservationId, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("validate-canvas-state")]
        public async Task<IActionResult> ValidateCanvasState([FromBody] CanvasValidationRequest request)
        {
            try
            {
                var response = await _reservationService.ValidateCanvasStateAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
