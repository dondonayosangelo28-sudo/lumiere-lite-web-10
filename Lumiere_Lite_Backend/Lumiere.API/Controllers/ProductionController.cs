using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/production")]
    [Authorize]
    public class ProductionController : ControllerBase
    {
        private readonly IProductionService _productionService;

        public ProductionController(IProductionService productionService)
        {
            _productionService = productionService;
        }

        [HttpGet("event/{eventId}/gantt")]
        public async Task<IActionResult> GetGanttSchedule(Guid eventId)
        {
            try
            {
                var schedule = await _productionService.GetGanttScheduleForEventAsync(eventId);
                return Ok(schedule);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPost("task")]
        public async Task<IActionResult> CreateTask([FromBody] ProductionTaskRequestDto dto)
        {
            try
            {
                var result = await _productionService.CreateTaskAsync(dto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpPut("task/{id}/progress")]
        public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateProgressRequestDto dto)
        {
            try
            {
                var result = await _productionService.UpdateProgressAsync(id, dto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
        }

        [HttpGet("quotas")]
        public async Task<IActionResult> GetQuotas()
        {
            var quotas = await _productionService.GetQuotasAsync();
            return Ok(quotas);
        }

        [HttpPost("quotas")]
        public async Task<IActionResult> SetQuota([FromBody] ProductionQuotaDto dto)
        {
            var result = await _productionService.SetQuotaAsync(dto);
            return Ok(result);
        }
    }
}
