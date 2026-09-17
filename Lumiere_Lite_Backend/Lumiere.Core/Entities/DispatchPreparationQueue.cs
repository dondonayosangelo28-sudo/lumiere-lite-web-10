using System;

namespace Lumiere.Core.Entities
{
    public class DispatchPreparationQueue
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid CanvasId { get; set; }
        public Guid AssetId { get; set; }
        public int QuantityRequired { get; set; }
        public string PrepStatus { get; set; } = "Pending Pull";
        public Guid? AssignedTo { get; set; }
        public string? PrepNotes { get; set; }
        public Guid? UpdatedBy { get; set; }
        
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public Event? Event { get; set; }
        public EventCanvas? Canvas { get; set; }
        public Asset? Asset { get; set; }
        public User? AssignedStaff { get; set; }
        public User? LastUpdater { get; set; }
    }
}
