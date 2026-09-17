using Lumiere.API.Security;
using Lumiere.Core.DTOs;
using Lumiere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/assets")]
    [Authorize]
    public class AssetController : ControllerBase
    {
        private readonly IAssetService _assetService;
        private readonly ICurrentUserService _currentUserService;

        public AssetController(IAssetService assetService, ICurrentUserService currentUserService)
        {
            _assetService = assetService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsset([FromBody] CreateAssetRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var userRoles = User.Claims.Where(c => c.Type == "roles").Select(c => c.Value).ToList();

                var assetId = await _assetService.CreateAssetAsync(request, currentUserId, userRoles);
                return Created($"/api/assets/{assetId}", new { AssetId = assetId });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAssets(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? tier = null,
            [FromQuery] string? state = null,
            [FromQuery] Guid? assetTypeId = null,
            [FromQuery] string? tagValue = null,
            [FromQuery] string? hexValue = null)
        {
            var assets = await _assetService.GetAssetsAsync(page, pageSize, tier, state, assetTypeId, tagValue, hexValue);
            return Ok(assets);
        }

        [HttpGet("{assetId}")]
        public async Task<IActionResult> GetAsset(Guid assetId)
        {
            try
            {
                var asset = await _assetService.GetAssetByIdAsync(assetId);
                return Ok(asset);
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPut("{assetId}")]
        public async Task<IActionResult> UpdateAsset(Guid assetId, [FromBody] UpdateAssetRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _assetService.UpdateAssetAsync(assetId, request, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{assetId}/colors")]
        public async Task<IActionResult> AddColor(Guid assetId, [FromBody] AddColorRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _assetService.AddColorAsync(assetId, request, currentUserId);
                return Ok();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{assetId}/tags")]
        public async Task<IActionResult> AddTag(Guid assetId, [FromBody] AddTagRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _assetService.AddTagAsync(assetId, request, currentUserId);
                return Ok();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{assetId}/transition")]
        public async Task<IActionResult> TransitionState(Guid assetId, [FromBody] TransitionStateRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var isWomAuthorizer = User.Claims.Any(c => c.Type == "roles" || c.Type == "role_name" && (c.Value == "Admin" || c.Value == "SystemAdmin" || c.Value == "Warehouse Operations Manager" || c.Value == "Warehouse Manager" || c.Value == "Inventory Officer"));

                await _assetService.TransitionStateAsync(assetId, request, currentUserId, isWomAuthorizer);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message }); // HTTP 400
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message }); // HTTP 400
            }
        }

        [HttpPost("{assetId}/salvage")]
        public async Task<IActionResult> SalvageAsset(Guid assetId, [FromBody] SalvageAssetRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var isWomAuthorizer = User.Claims.Any(c => c.Type == "roles" || c.Type == "role_name" && (c.Value == "Admin" || c.Value == "SystemAdmin" || c.Value == "Warehouse Operations Manager" || c.Value == "Warehouse Manager" || c.Value == "Inventory Officer"));

                await _assetService.SalvageAssetAsync(assetId, request, currentUserId, isWomAuthorizer);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Error = ex.Message });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
