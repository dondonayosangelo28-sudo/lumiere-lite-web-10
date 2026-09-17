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
    [Route("api/deficit-queue")]
    [Authorize]
    public class DeficitQueueController : ControllerBase
    {
        private readonly IDeficitQueueService _deficitQueueService;
        private readonly ICurrentUserService _currentUserService;

        public DeficitQueueController(IDeficitQueueService deficitQueueService, ICurrentUserService currentUserService)
        {
            _deficitQueueService = deficitQueueService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> FlagDeficit([FromBody] CreateDeficitRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var deficitId = await _deficitQueueService.FlagDeficitAsync(request, currentUserId);
                return Created($"/api/deficit-queue/{deficitId}", new { DeficitId = deficitId });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDeficits([FromQuery] Guid? eventId = null, [FromQuery] string? status = null)
        {
            var deficits = await _deficitQueueService.GetDeficitsAsync(eventId, status);
            return Ok(deficits);
        }

        [HttpPatch("{deficitId}/status")]
        public async Task<IActionResult> UpdateStatus(Guid deficitId, [FromBody] UpdateDeficitStatusRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _deficitQueueService.UpdateStatusAsync(deficitId, request, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }
    }
}
