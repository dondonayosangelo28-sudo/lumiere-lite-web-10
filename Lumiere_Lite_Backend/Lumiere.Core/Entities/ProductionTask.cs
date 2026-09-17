using System;

namespace Lumiere.Core.Entities
{
    public class ProductionTask
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public string TaskName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Carpentry, Metalwork, Upholstery, Assembly, Paint
        public int TargetQuantity { get; set; }
        public int CompletedQuantity { get; set; }
        public decimal ProgressPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, In-Progress, Completed, Delayed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Event? Event { get; set; }
        public User? AssignedUser { get; set; }
    }
}
