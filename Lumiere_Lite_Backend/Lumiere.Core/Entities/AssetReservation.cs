using System;

namespace Lumiere.Core.Entities
{
    public class AssetReservation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid AssetId { get; set; }
        public DateTimeOffset LockStart { get; set; }
        public DateTimeOffset LockEnd { get; set; }
        public bool IsProvisional { get; set; } = false;
        public Guid ReservedBy { get; set; }
        public DateTimeOffset ReservedAt { get; set; } = DateTimeOffset.UtcNow;
        public string Status { get; set; } = "Committed"; // kept for application compatibility
        
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public Event? Event { get; set; }
        public Asset? Asset { get; set; }
        public User? Reserver { get; set; }
    }
}
