using System;

namespace Lumiere.Core.Entities
{
    public class AssetMaintenanceHistory
    {
        public Guid Id { get; set; } = Guid.NewGuid(); // maps to record_id
        public Guid AssetId { get; set; }
        public Guid EventId { get; set; }
        public Guid ReportId { get; set; }
        public decimal RepairCost { get; set; }
        public decimal CumulativeRepairCost { get; set; }
        public bool DepreciationFlagged { get; set; } = false;
        public string? MaintenanceNotes { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        public Asset? Asset { get; set; }
        public Event? Event { get; set; }
        public DamageReport? DamageReport { get; set; }
    }
}
