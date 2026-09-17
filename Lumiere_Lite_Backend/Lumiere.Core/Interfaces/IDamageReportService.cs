using Lumiere.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IDamageReportService
    {
        Task<Guid> SubmitDamageReportAsync(CreateDamageReportRequest request, Guid currentUserId);
        Task<List<DamageReportResponse>> GetDamageReportsByEventAsync(Guid eventId);
        Task<DamageReportResponse> GetDamageReportByIdAsync(Guid reportId);
        Task<DamageReportResponse> SignOffDamageReportAsync(Guid reportId, DamageSignOffRequest request, Guid currentUserId, string currentUserEmail, string currentUserName, List<string> userRoles);
        Task<DamageReportResponse> AdminEmergencyUnblockAsync(Guid reportId, AdminEmergencyUnblockRequest request, Guid currentUserId, string currentUserEmail);
        Task CompleteMaintenanceAsync(Guid reportId, Guid currentUserId, List<string> userRoles);
        Task<bool> IsEventSettlementBlockedAsync(Guid eventId);
    }
}
