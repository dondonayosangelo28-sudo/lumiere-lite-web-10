using System;

namespace Lumiere.Core.Entities
{
    public class ManningAssignment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public DateTime ShiftDate { get; set; }
        public TimeSpan? ShiftStartTime { get; set; }
        public TimeSpan? ShiftEndTime { get; set; }
        public string? Notes { get; set; }
        public bool IsOverride { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Event? Event { get; set; }
        public User? User { get; set; }
    }
}
