using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace Lumiere.Infrastructure.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;

        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(Guid? actorId, string actionType, string affectedTable, Guid affectedRecordId, object? previousState, object? newState)
        {
            var log = new AuditLog
            {
                ActorId = actorId,
                ActionType = actionType,
                AffectedTable = affectedTable,
                AffectedRecordId = affectedRecordId,
                PreviousState = previousState != null ? JsonSerializer.SerializeToDocument(previousState) : null,
                NewState = newState != null ? JsonSerializer.SerializeToDocument(newState) : null,
                LoggedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
