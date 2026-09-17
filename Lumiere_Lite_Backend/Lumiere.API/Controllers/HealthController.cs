using Lumiere.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public HealthController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("health")]
        [HttpGet("api/health")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                var providerName = _dbContext.Database.ProviderName ?? "Unknown";
                bool isInMemory = providerName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

                if (isInMemory)
                {
                    return StatusCode(503, new
                    {
                        status = "Degraded",
                        database = providerName,
                        reason = "InMemory database active; Production requires PostgreSQL",
                        timestamp = DateTime.UtcNow
                    });
                }

                bool canConnect = await _dbContext.Database.CanConnectAsync();
                if (!canConnect)
                {
                    return StatusCode(503, new
                    {
                        status = "Unhealthy",
                        database = providerName,
                        reason = "Database connection test failed",
                        timestamp = DateTime.UtcNow
                    });
                }

                return Ok(new
                {
                    status = "Healthy",
                    database = providerName,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    status = "Unhealthy",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
