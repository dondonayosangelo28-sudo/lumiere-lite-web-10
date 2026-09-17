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
    [Route("api/admin/permissions/ephemeral")]
    [Authorize]
    [RequireRole("Admin")]
    public class AdminPermissionsController : ControllerBase
    {
        private readonly IEphemeralPermissionService _permissionService;
        private readonly ICurrentUserService _currentUserService;

        public AdminPermissionsController(IEphemeralPermissionService permissionService, ICurrentUserService currentUserService)
        {
            _permissionService = permissionService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> GrantPermission([FromBody] GrantEphemeralPermissionRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var permId = await _permissionService.GrantPermissionAsync(request, currentUserId);
                return Created("", new { PermId = permId }); // HTTP 201
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActivePermissions()
        {
            var permissions = await _permissionService.GetActivePermissionsAsync();
            return Ok(permissions);
        }

        [HttpDelete("{permId}")]
        public async Task<IActionResult> RevokePermission(Guid permId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _permissionService.RevokePermissionAsync(permId, currentUserId);
                return NoContent();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }
    }
}
