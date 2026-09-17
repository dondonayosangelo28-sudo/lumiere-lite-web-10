using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;

namespace Lumiere.Application.Services
{
    public interface IManningService
    {
        Task<IEnumerable<ManningAssignmentResponseDto>> GetAssignmentsForEventAsync(Guid eventId);
        Task<IEnumerable<ManningAssignmentResponseDto>> GetAssignmentsForUserAsync(Guid userId);
        Task<ManningAssignmentResponseDto> AssignCrewAsync(AssignCrewRequestDto dto, Guid performingUserId);
        Task<bool> RemoveAssignmentAsync(Guid assignmentId, Guid performingUserId);
    }
}
