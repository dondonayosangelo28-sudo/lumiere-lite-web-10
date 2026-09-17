using Lumiere.API.Security;
using Lumiere.Core.DTOs;
using Lumiere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/events")]
    [Authorize]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly ICurrentUserService _currentUserService;

        public EventController(IEventService eventService, ICurrentUserService currentUserService)
        {
            _eventService = eventService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        [RequireRole("Executive")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var eventId = await _eventService.CreateEventAsync(request, currentUserId);
                return Created($"/api/events/{eventId}", new { EventId = eventId });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Error = ex.Message }); // 409 Conflict
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? statusFilter = null)
        {
            var events = await _eventService.GetEventsAsync(page, pageSize, statusFilter);
            return Ok(events);
        }

        [HttpGet("{eventId}")]
        public async Task<IActionResult> GetEvent(Guid eventId)
        {
            try
            {
                var e = await _eventService.GetEventByIdAsync(eventId);
                return Ok(e);
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPatch("{eventId}/acknowledge-loss-maker")]
        [RequireRole("Executive")]
        public async Task<IActionResult> AcknowledgeLossMaker(Guid eventId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _eventService.AcknowledgeLossMakerAsync(eventId, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPut("{eventId}")]
        [RequireRole("Admin")]
        public async Task<IActionResult> UpdateEvent(Guid eventId, [FromBody] UpdateEventRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _eventService.UpdateEventAsync(eventId, request, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{eventId}/access")]
        public async Task<IActionResult> GrantCanvasAccess(Guid eventId, [FromBody] GrantCanvasAccessRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _eventService.GrantCanvasAccessAsync(eventId, request, currentUserId);
                return Created($"/api/events/{eventId}/access", new { Message = "Access granted successfully." });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Error = ex.Message }); // 409 Conflict
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPut("{eventId}/access/{targetUserId}")]
        public async Task<IActionResult> ModifyCanvasAccess(Guid eventId, Guid targetUserId, [FromBody] ModifyCanvasAccessRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _eventService.ModifyCanvasAccessAsync(eventId, targetUserId, request, currentUserId);
                return Ok(new { Message = "Access modified successfully." });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("{eventId}/access/{targetUserId}")]
        public async Task<IActionResult> RevokeCanvasAccess(Guid eventId, Guid targetUserId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _eventService.RevokeCanvasAccessAsync(eventId, targetUserId, currentUserId);
                return Ok(new { Message = "Access revoked successfully." });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{eventId}/access")]
        public async Task<IActionResult> GetCanvasAccessList(Guid eventId)
        {
            try
            {
                var viewers = await _eventService.GetActiveCanvasViewersAsync(eventId);
                return Ok(viewers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
