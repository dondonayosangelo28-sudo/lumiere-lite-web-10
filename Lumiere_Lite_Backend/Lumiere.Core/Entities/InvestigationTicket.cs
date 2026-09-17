using System;

namespace Lumiere.Core.Entities
{
    public class InvestigationTicket
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AssetId { get; set; }
        public Guid? EventId { get; set; }
        public Guid? ReportId { get; set; }
        public string TicketStatus { get; set; } = "Open";
        public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
        public DateTime AutoExpireAt { get; set; }
        public Guid? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Asset? Asset { get; set; }
        public Event? Event { get; set; }
        public DamageReport? DamageReport { get; set; }
        public User? Resolver { get; set; }
    }
}
