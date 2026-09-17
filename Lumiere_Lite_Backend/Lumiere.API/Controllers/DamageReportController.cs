using Lumiere.API.Security;
using Lumiere.Core.DTOs;
using Lumiere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/damage-reports")]
    [Authorize]
    public class DamageReportController : ControllerBase
    {
        private readonly IDamageReportService _damageReportService;
        private readonly ICurrentUserService _currentUserService;

        public DamageReportController(IDamageReportService damageReportService, ICurrentUserService currentUserService)
        {
            _damageReportService = damageReportService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitDamageReport([FromBody] CreateDamageReportRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var reportId = await _damageReportService.SubmitDamageReportAsync(request, currentUserId);
                return Created($"/api/damage-reports/{reportId}", new { ReportId = reportId });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("event/{eventId}")]
        public async Task<IActionResult> GetDamageReportsByEvent(Guid eventId)
        {
            var reports = await _damageReportService.GetDamageReportsByEventAsync(eventId);
            return Ok(reports);
        }

        [HttpGet("{reportId}")]
        public async Task<IActionResult> GetDamageReportById(Guid reportId)
        {
            try
            {
                var report = await _damageReportService.GetDamageReportByIdAsync(reportId);
                return Ok(report);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{reportId}/sign-off")]
        public async Task<IActionResult> SignOffDamageReport(Guid reportId, [FromBody] DamageSignOffRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value ?? string.Empty;
                var currentUserName = User.FindFirst("name")?.Value ?? currentUserEmail;
                var userRoles = GetUserRoles();

                var response = await _damageReportService.SignOffDamageReportAsync(
                    reportId, request, currentUserId, currentUserEmail, currentUserName, userRoles);

                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{reportId}/admin-unblock")]
        [RequireRole("Admin")]
        public async Task<IActionResult> AdminEmergencyUnblock(Guid reportId, [FromBody] AdminEmergencyUnblockRequest request)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value ?? string.Empty;

                var response = await _damageReportService.AdminEmergencyUnblockAsync(
                    reportId, request, currentUserId, currentUserEmail);

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("{reportId}/complete-maintenance")]
        public async Task<IActionResult> CompleteMaintenance(Guid reportId)
        {
            try
            {
                var currentUserId = _currentUserService.UserId ?? Guid.Empty;
                var userRoles = GetUserRoles();

                await _damageReportService.CompleteMaintenanceAsync(reportId, currentUserId, userRoles);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpGet("event/{eventId}/settlement-blocked")]
        public async Task<IActionResult> IsEventSettlementBlocked(Guid eventId)
        {
            var isBlocked = await _damageReportService.IsEventSettlementBlockedAsync(eventId);
            return Ok(new { EventId = eventId, IsSettlementBlocked = isBlocked, Blocked = isBlocked });
        }

        private List<string> GetUserRoles()
        {
            var roles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role_name" || c.Type == "roles")
                .Select(c => c.Value)
                .ToList();

            return roles;
        }
    }
}
