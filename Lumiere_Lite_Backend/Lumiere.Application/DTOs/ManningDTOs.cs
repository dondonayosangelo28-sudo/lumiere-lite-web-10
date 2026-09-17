using System;

namespace Lumiere.Application.DTOs
{
    public class AssignCrewRequestDto
    {
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public DateTime ShiftDate { get; set; }
        public TimeSpan? ShiftStartTime { get; set; }
        public TimeSpan? ShiftEndTime { get; set; }
        public string? Notes { get; set; }
        public bool IsOverride { get; set; } = false;
    }

    public class ManningAssignmentResponseDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public DateTime ShiftDate { get; set; }
        public TimeSpan? ShiftStartTime { get; set; }
        public TimeSpan? ShiftEndTime { get; set; }
        public string? Notes { get; set; }
        public bool IsOverride { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
