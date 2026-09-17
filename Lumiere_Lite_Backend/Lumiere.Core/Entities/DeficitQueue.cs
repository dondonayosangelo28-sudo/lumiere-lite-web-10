using System;

namespace Lumiere.Core.Entities
{
    public class DeficitQueue
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid? AssetId { get; set; }
        public string? AssetDescription { get; set; }
        public int QuantityNeeded { get; set; }
        public string DeficitStatus { get; set; } = Entities.DeficitStatus.NotPurchased;
        public Guid FlaggedBy { get; set; }
        public DateTime FlaggedAt { get; set; } = DateTime.UtcNow;
        public Guid? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
        
        // Extended DeficitItem fields from frontend model
        public string? Priority { get; set; } // Low | Medium | High | Critical
        public string? TriggerSource { get; set; } // Canvas | Batch Pahabol | Manual Audit | Auto-Threshold
        public Guid? PrimaryVendorId { get; set; }
        public Guid? BackupVendorId { get; set; }
        public decimal? CostPerUnit { get; set; }
        public string? Unit { get; set; }
        public int? CurrentStock { get; set; }
        public int? Threshold { get; set; }
        public string? Category { get; set; }
        public bool? TaggedForDispatch { get; set; }

        // PO-adjacent optional fields
        public int? ReorderQty { get; set; }
        public string? PoRef { get; set; }
        public int? EtaHours { get; set; }
        public string? Supplier { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Event? Event { get; set; }
        public Asset? Asset { get; set; }
        public User? Flagger { get; set; }
        public User? Resolver { get; set; }
        public Vendor? PrimaryVendor { get; set; }
        public Vendor? BackupVendor { get; set; }
    }
}
