using System;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class CreateDeficitRequest
    {
        [Required]
        public Guid EventId { get; set; }
        public Guid? AssetId { get; set; }
        public string? AssetDescription { get; set; }
        
        [Required]
        [Range(1, 10000)]
        public int QuantityNeeded { get; set; }

        public string? Priority { get; set; }
        public string? TriggerSource { get; set; }
        public Guid? PrimaryVendorId { get; set; }
        public Guid? BackupVendorId { get; set; }
        public decimal? CostPerUnit { get; set; }
        public string? Unit { get; set; }
        public int? CurrentStock { get; set; }
        public int? Threshold { get; set; }
        public string? Category { get; set; }
        public bool? TaggedForDispatch { get; set; }

        public int? ReorderQty { get; set; }
        public string? PoRef { get; set; }
        public int? EtaHours { get; set; }
        public string? Supplier { get; set; }
    }

    public class UpdateDeficitStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        public string? Priority { get; set; }
        public string? TriggerSource { get; set; }
        public Guid? PrimaryVendorId { get; set; }
        public Guid? BackupVendorId { get; set; }
        public decimal? CostPerUnit { get; set; }
        public string? Unit { get; set; }
        public int? CurrentStock { get; set; }
        public int? Threshold { get; set; }
        public string? Category { get; set; }
        public bool? TaggedForDispatch { get; set; }

        public int? ReorderQty { get; set; }
        public string? PoRef { get; set; }
        public int? EtaHours { get; set; }
        public string? Supplier { get; set; }
    }

    public class DeficitResponse
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid? AssetId { get; set; }
        public string? AssetDescription { get; set; }
        public int QuantityNeeded { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Priority { get; set; }
        public string? TriggerSource { get; set; }
        public Guid? PrimaryVendorId { get; set; }
        public Guid? BackupVendorId { get; set; }
        public decimal? CostPerUnit { get; set; }
        public string? Unit { get; set; }
        public int? CurrentStock { get; set; }
        public int? Threshold { get; set; }
        public string? Category { get; set; }
        public bool? TaggedForDispatch { get; set; }
        public int? ReorderQty { get; set; }
        public string? PoRef { get; set; }
        public int? EtaHours { get; set; }
        public string? Supplier { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
