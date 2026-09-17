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
    [Route("api/canvas")]
    [Authorize]
    public class CanvasController : ControllerBase
    {
        private readonly ICanvasService _canvasService;
        private readonly ICurrentUserService _currentUserService;

        public CanvasController(ICanvasService canvasService, ICurrentUserService currentUserService)
        {
            _canvasService = canvasService;
            _currentUserService = currentUserService;
        }

        [HttpGet("event/{eventId}")]
        public async Task<IActionResult> GetCanvas(Guid eventId)
        {
            var canvas = await _canvasService.GetCanvasByEventIdAsync(eventId);
            if (canvas == null)
                return NotFound(new { Message = "Canvas layout not found for this event." });

            return Ok(canvas);
        }

        [HttpPut("event/{eventId}")]
        public async Task<IActionResult> SaveCanvas(Guid eventId, [FromBody] SaveCanvasRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var canvas = await _canvasService.SaveCanvasAsync(eventId, request, currentUserId);
                return Ok(canvas);
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("event/{eventId}/approve")]
        [RequireRole("Event Planner")]
        public async Task<IActionResult> ApproveCanvas(Guid eventId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var canvas = await _canvasService.ApproveCanvasAsync(eventId, currentUserId);
                return Ok(canvas);
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }
    }
}
