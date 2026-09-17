using System;
using System.Text.Json;

namespace Lumiere.Core.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? ActorId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string? AffectedTable { get; set; }
        public Guid? AffectedRecordId { get; set; }
        public JsonDocument? PreviousState { get; set; }
        public JsonDocument? NewState { get; set; }
        public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }

        public User? Actor { get; set; }
    }
}
