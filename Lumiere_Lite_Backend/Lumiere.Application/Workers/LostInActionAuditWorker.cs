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
    public class LostInActionAuditWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LostInActionAuditWorker> _logger;

        public LostInActionAuditWorker(IServiceProvider serviceProvider, ILogger<LostInActionAuditWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("LostInActionAuditWorker starting.");
            using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessLostInActionTickets(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing ProcessLostInActionTickets.");
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    await timer.WaitForNextTickAsync(stoppingToken);
                }
            }

            _logger.LogInformation("LostInActionAuditWorker stopping.");
        }

        private async Task ProcessLostInActionTickets(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var auditLogService = scope.ServiceProvider.GetRequiredService<IAuditLogService>();

            var expiredTickets = await dbContext.InvestigationTickets
                .Where(t => t.TicketStatus == "Open" && t.AutoExpireAt <= DateTime.UtcNow)
                .ToListAsync(stoppingToken);

            if (!expiredTickets.Any()) return;

            foreach (var ticket in expiredTickets)
            {
                ticket.TicketStatus = "Declared Financial Loss";
                ticket.UpdatedAt = DateTime.UtcNow;

                // Log the financial loss declaration
                // A system guid or null can represent the system user. Assuming Guid.Empty.
                await auditLogService.LogAsync(Guid.Empty, "LIA_DECLARED", "investigation_tickets", ticket.Id, new { TicketStatus = "Open" }, new { TicketStatus = "Declared Financial Loss" });
            }

            await dbContext.SaveChangesAsync(stoppingToken);
            _logger.LogInformation($"Processed {expiredTickets.Count} expired investigation tickets into financial loss.");
        }
    }
}
