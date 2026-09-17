using Lumiere.Core.Interfaces;
using Lumiere.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/assets/bulk-import")]
    [Authorize]
    public class AssetImportController : ControllerBase
    {
        private readonly IAssetImportService _assetImportService;
        private readonly ICurrentUserService _currentUserService;

        public AssetImportController(IAssetImportService assetImportService, ICurrentUserService currentUserService)
        {
            _assetImportService = assetImportService;
            _currentUserService = currentUserService;
        }

        [HttpPost("phase1")]
        public async Task<IActionResult> Phase1Import(IFormFile csvFile)
        {
            try
            {
                if (csvFile == null) return BadRequest("File is missing.");
                
                using var stream = csvFile.OpenReadStream();
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var assetIds = await _assetImportService.ImportAssetsPhase1Async(stream, currentUserId);
                
                return Ok(new { AssetIds = assetIds, Message = "Phase 1 successful." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("phase2")]
        public async Task<IActionResult> Phase2Import([FromForm] IFormFileCollection images, [FromForm] List<Guid> assetIds)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                
                var streams = new List<Stream>();
                foreach (var img in images)
                {
                    streams.Add(img.OpenReadStream());
                }

                await _assetImportService.ImportAssetsPhase2Async(streams, assetIds, currentUserId);
                
                foreach (var stream in streams)
                {
                    stream.Dispose();
                }

                return Ok(new { Message = "Phase 2 processing completed." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
