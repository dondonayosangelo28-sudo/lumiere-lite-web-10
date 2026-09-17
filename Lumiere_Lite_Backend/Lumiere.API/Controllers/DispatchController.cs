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
    [Route("api/dispatch")]
    [Authorize]
    public class DispatchController : ControllerBase
    {
        private readonly IDispatchService _dispatchService;
        private readonly ICurrentUserService _currentUserService;

        public DispatchController(IDispatchService dispatchService, ICurrentUserService currentUserService)
        {
            _dispatchService = dispatchService;
            _currentUserService = currentUserService;
        }

        [HttpGet("event/{eventId}/packing-list")]
        [RequireRole("Warehouse Operations Manager")]
        public async Task<IActionResult> GetPackingList(Guid eventId)
        {
            var result = await _dispatchService.GetPackingListAsync(eventId);
            return Ok(result);
        }

        [HttpPost("event/{eventId}/prepare")]
        [RequireRole("Warehouse Operations Manager")]
        public async Task<IActionResult> PrepareDispatch(Guid eventId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _dispatchService.PrepareDispatchAsync(eventId, currentUserId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("event/{eventId}/verify-item")]
        [RequireRole("Warehouse Operations Manager")]
        public async Task<IActionResult> VerifyItem(Guid eventId, [FromBody] VerifyItemRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var response = await _dispatchService.VerifyItemAsync(eventId, request.AssetId, currentUserId);
                return Ok(response);
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("event/{eventId}/force-dispatch")]
        [RequireRole("Warehouse Operations Manager")]
        public async Task<IActionResult> ForceDispatch(Guid eventId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _dispatchService.ForceDispatchAsync(eventId, currentUserId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("asset/{assetId}/status")]
        public async Task<IActionResult> UpdateAssetStatus(Guid assetId, [FromBody] UpdateAssetStateRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _dispatchService.UpdateAssetStateAtomicAsync(assetId, request.TargetState, currentUserId, request.EventId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
