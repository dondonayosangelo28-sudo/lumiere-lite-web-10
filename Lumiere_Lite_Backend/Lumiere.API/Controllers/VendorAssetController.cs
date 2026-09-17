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
    [Route("api/assets/{assetId}/vendors")]
    [Authorize]
    public class VendorAssetController : ControllerBase
    {
        private readonly IVendorService _vendorService;
        private readonly ICurrentUserService _currentUserService;

        public VendorAssetController(IVendorService vendorService, ICurrentUserService currentUserService)
        {
            _vendorService = vendorService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> LinkVendorToAsset(Guid assetId, [FromBody] LinkVendorAssetRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _vendorService.LinkAssetVendorAsync(assetId, request, currentUserId);
                return Ok();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }
    }
}
