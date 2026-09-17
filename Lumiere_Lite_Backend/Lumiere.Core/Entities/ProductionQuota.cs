using System;

namespace Lumiere.Core.Entities
{
    public class ProductionQuota
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Department { get; set; } = string.Empty; // Carpentry, Metalwork, Upholstery, Assembly, Paint
        public int DailyTargetUnits { get; set; }
        public DateTime EffectiveDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
