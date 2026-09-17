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
    [Route("api/vendors")]
    [Authorize]
    public class VendorController : ControllerBase
    {
        private readonly IVendorService _vendorService;
        private readonly ICurrentUserService _currentUserService;

        public VendorController(IVendorService vendorService, ICurrentUserService currentUserService)
        {
            _vendorService = vendorService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateVendor([FromBody] CreateVendorRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var vendorId = await _vendorService.CreateVendorAsync(request, currentUserId);
                return Created($"/api/vendors/{vendorId}", new { VendorId = vendorId });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Error = ex.Message });
            }
        }

        [HttpPost("{vendorId}/representatives")]
        public async Task<IActionResult> AddRepresentative(Guid vendorId, [FromBody] AddRepresentativeRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var repId = await _vendorService.AddRepresentativeAsync(vendorId, request, currentUserId);
                return Created($"/api/vendors/{vendorId}/representatives/{repId}", new { RepresentativeId = repId });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{vendorId}/representatives/{repId}/contact-numbers")]
        public async Task<IActionResult> AddContactNumber(Guid vendorId, Guid repId, [FromBody] AddContactRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _vendorService.AddContactNumberAsync(vendorId, repId, request, currentUserId);
                return Ok();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{vendorId}/representatives/{repId}/platforms")]
        public async Task<IActionResult> AddPlatform(Guid vendorId, Guid repId, [FromBody] AddPlatformRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                await _vendorService.AddPlatformAsync(vendorId, repId, request, currentUserId);
                return Ok();
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetVendors()
        {
            var vendors = await _vendorService.GetVendorsAsync();
            return Ok(vendors);
        }
    }
}
