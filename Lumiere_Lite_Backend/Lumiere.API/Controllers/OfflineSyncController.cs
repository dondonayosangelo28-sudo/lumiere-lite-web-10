using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/field")]
    [Authorize]
    public class OfflineSyncController : ControllerBase
    {
        private readonly IOfflineSyncService _offlineSyncService;

        public OfflineSyncController(IOfflineSyncService offlineSyncService)
        {
            _offlineSyncService = offlineSyncService;
        }

        [HttpPost("sync")]
        public async Task<IActionResult> ProcessBatchSync([FromBody] FieldReportSyncRequestDto dto)
        {
            var performingUserId = GetCurrentUserId();
            var result = await _offlineSyncService.ProcessBatchSyncAsync(dto, performingUserId);
            return Ok(result);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingItems()
        {
            var performingUserId = GetCurrentUserId();
            var items = await _offlineSyncService.GetPendingItemsForUserAsync(performingUserId);
            return Ok(items);
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
