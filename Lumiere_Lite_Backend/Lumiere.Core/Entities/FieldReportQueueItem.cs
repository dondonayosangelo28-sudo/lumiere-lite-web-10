using System;

namespace Lumiere.Core.Entities
{
    public class FieldReportQueueItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string ClientTxId { get; set; } = string.Empty; // Idempotency key from client
        public string EventType { get; set; } = string.Empty; // CONFIRM_OUTBOUND, CONFIRM_RETURN, DECLARE_DAMAGE
        public Guid EventId { get; set; }
        public Guid? AssetId { get; set; }
        public string PayloadJson { get; set; } = "{}";
        public string Status { get; set; } = "Pending"; // Pending, Processed, Failed
        public string? ErrorMessage { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        public Guid SubmittedBy { get; set; }

        public Event? Event { get; set; }
        public Asset? Asset { get; set; }
        public User? Submitter { get; set; }
    }
}
