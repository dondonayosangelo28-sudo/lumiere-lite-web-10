using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Lumiere.Application.Workers
{
    public class EphemeralExpiryAuditWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EphemeralExpiryAuditWorker> _logger;

        public EphemeralExpiryAuditWorker(IServiceProvider serviceProvider, ILogger<EphemeralExpiryAuditWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using PeriodicTimer timer = new PeriodicTimer(TimeSpan.FromMinutes(15));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredPermissionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing EphemeralExpiryAuditWorker.");
                }
                
                await timer.WaitForNextTickAsync(stoppingToken);
            }
        }

        private async Task ProcessExpiredPermissionsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var auditLogService = scope.ServiceProvider.GetRequiredService<IAuditLogService>();

            var now = DateTime.UtcNow;

            // Find permissions that have expired but don't have an EPHEMERAL_EXPIRY audit log
            // Also exclude ones that were EPHEMERAL_REVOKED
            var expiredPermissions = await dbContext.EphemeralPermissions
                .Where(ep => ep.EndTimestamp <= now)
                .Where(ep => !dbContext.AuditLogs.Any(log => log.AffectedRecordId == ep.Id && (log.ActionType == "EPHEMERAL_EXPIRY" || log.ActionType == "EPHEMERAL_REVOKED")))
                .ToListAsync(stoppingToken);

            foreach (var permission in expiredPermissions)
            {
                await auditLogService.LogAsync(
                    null, // System action, no specific user
                    "EPHEMERAL_EXPIRY",
                    "ephemeral_permissions",
                    permission.Id,
                    null,
                    new { ExpiredAt = permission.EndTimestamp }
                );
            }

            _logger.LogInformation("Processed {Count} expired ephemeral permissions.", expiredPermissions.Count);
        }
    }
}
