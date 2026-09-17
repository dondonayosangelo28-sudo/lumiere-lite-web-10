using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Lumiere.API.Security;
using Lumiere.Application.DTOs;
using Lumiere.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/manning")]
    [Authorize]
    public class ManningController : ControllerBase
    {
        private readonly IManningService _manningService;

        public ManningController(IManningService manningService)
        {
            _manningService = manningService;
        }

        [HttpGet("event/{eventId}")]
        public async Task<IActionResult> GetAssignmentsForEvent(Guid eventId)
        {
            var assignments = await _manningService.GetAssignmentsForEventAsync(eventId);
            return Ok(assignments);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetAssignmentsForUser(Guid userId)
        {
            var assignments = await _manningService.GetAssignmentsForUserAsync(userId);
            return Ok(assignments);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignCrew([FromBody] AssignCrewRequestDto dto)
        {
            try
            {
                var performingUserId = GetCurrentUserId();
                var result = await _manningService.AssignCrewAsync(dto, performingUserId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveAssignment(Guid id)
        {
            var performingUserId = GetCurrentUserId();
            var success = await _manningService.RemoveAssignmentAsync(id, performingUserId);
            if (!success)
            {
                return NotFound(new { Error = $"Manning assignment with ID '{id}' was not found." });
            }

            return NoContent();
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
