using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumiere.Application.Services
{
    public class ManningService : IManningService
    {
        private readonly AppDbContext _context;

        public ManningService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ManningAssignmentResponseDto>> GetAssignmentsForEventAsync(Guid eventId)
        {
            var assignments = await _context.ManningAssignments
                .Include(m => m.Event)
                .Include(m => m.User)
                .Where(m => m.EventId == eventId)
                .OrderBy(m => m.ShiftDate)
                .ThenBy(m => m.ShiftStartTime)
                .ToListAsync();

            return assignments.Select(MapToResponseDto);
        }

        public async Task<IEnumerable<ManningAssignmentResponseDto>> GetAssignmentsForUserAsync(Guid userId)
        {
            var assignments = await _context.ManningAssignments
                .Include(m => m.Event)
                .Include(m => m.User)
                .Where(m => m.UserId == userId)
                .OrderBy(m => m.ShiftDate)
                .ThenBy(m => m.ShiftStartTime)
                .ToListAsync();

            return assignments.Select(MapToResponseDto);
        }

        public async Task<ManningAssignmentResponseDto> AssignCrewAsync(AssignCrewRequestDto dto, Guid performingUserId)
        {
            var ev = await _context.Events.FindAsync(dto.EventId);
            if (ev == null)
            {
                throw new KeyNotFoundException($"Event with ID '{dto.EventId}' was not found.");
            }

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{dto.UserId}' was not found.");
            }

            // Check double-booking on same shift date across different events
            var existingAssignment = await _context.ManningAssignments
                .Include(m => m.Event)
                .FirstOrDefaultAsync(m => m.UserId == dto.UserId &&
                                          m.EventId != dto.EventId &&
                                          m.ShiftDate.Date == dto.ShiftDate.Date);

            if (existingAssignment != null && !dto.IsOverride)
            {
                var conflictEventName = existingAssignment.Event?.Name ?? existingAssignment.EventId.ToString();
                throw new InvalidOperationException(
                    $"Crew member '{user.FullName}' is already assigned to event '{conflictEventName}' on {dto.ShiftDate:yyyy-MM-dd}. Double-booking requires an explicit override.");
            }

            var assignment = new ManningAssignment
            {
                Id = Guid.NewGuid(),
                EventId = dto.EventId,
                UserId = dto.UserId,
                RoleName = dto.RoleName,
                ShiftDate = dto.ShiftDate.Date,
                ShiftStartTime = dto.ShiftStartTime,
                ShiftEndTime = dto.ShiftEndTime,
                Notes = dto.Notes,
                IsOverride = dto.IsOverride,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ManningAssignments.Add(assignment);

            if (existingAssignment != null && dto.IsOverride)
            {
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    ActorId = performingUserId,
                    ActionType = "DOUBLE_BOOKING_OVERRIDE",
                    AffectedTable = "manning_assignments",
                    AffectedRecordId = assignment.Id,
                    LoggedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
            }

            await _context.SaveChangesAsync();

            // Reload navigation properties for clean response
            assignment.Event = ev;
            assignment.User = user;

            return MapToResponseDto(assignment);
        }

        public async Task<bool> RemoveAssignmentAsync(Guid assignmentId, Guid performingUserId)
        {
            var assignment = await _context.ManningAssignments.FindAsync(assignmentId);
            if (assignment == null)
            {
                return false;
            }

            _context.ManningAssignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return true;
        }

        private static ManningAssignmentResponseDto MapToResponseDto(ManningAssignment entity)
        {
            return new ManningAssignmentResponseDto
            {
                Id = entity.Id,
                EventId = entity.EventId,
                EventName = entity.Event?.Name ?? string.Empty,
                UserId = entity.UserId,
                UserName = entity.User?.FullName ?? string.Empty,
                UserEmail = entity.User?.Email ?? string.Empty,
                RoleName = entity.RoleName,
                ShiftDate = entity.ShiftDate,
                ShiftStartTime = entity.ShiftStartTime,
                ShiftEndTime = entity.ShiftEndTime,
                Notes = entity.Notes,
                IsOverride = entity.IsOverride,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
