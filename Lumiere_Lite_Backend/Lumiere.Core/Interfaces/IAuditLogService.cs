using System;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IAuditLogService
    {
        Task LogAsync(Guid? actorId, string actionType, string affectedTable, Guid affectedRecordId, object? previousState, object? newState);
    }
}
