using System;
using System.Collections.Generic;

namespace Lumiere.Core.Entities
{
    public class Asset
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? AssetTypeId { get; set; }
        public Guid? AssetSubTypeId { get; set; }
        public int AssetTier { get; set; } = 1;
        public string AssetState { get; set; } = "Available";
        public string Name { get; set; } = string.Empty;
        public string? ItemCallName { get; set; }
        public string? Description { get; set; }
        public int BaseCount { get; set; } = 1;
        public string Unit { get; set; } = "pcs";
        public decimal? Cost { get; set; }
        public string? Shape { get; set; }
        public decimal? Height { get; set; }
        public decimal? Width { get; set; }
        public decimal? Weight { get; set; }
        public bool IsCircular { get; set; } = false;
        public decimal? Circumference { get; set; }
        public bool IsMonoColor { get; set; } = false;
        public bool IsMultiColor { get; set; } = false;
        public bool IsChangeableColor { get; set; } = false;
        public string? Origin { get; set; }
        public string? Material { get; set; }
        public bool IsFragile { get; set; } = false;
        public string? KittingData { get; set; } // stored as JSONB string
        public string? PhotoUrl { get; set; }
        public decimal? OriginalValue { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public AssetType? AssetType { get; set; }
        public AssetSubType? AssetSubType { get; set; }
        public ICollection<AssetColor> Colors { get; set; } = new List<AssetColor>();
        public ICollection<AssetTag> Tags { get; set; } = new List<AssetTag>();
        public ICollection<AssetVendor> Vendors { get; set; } = new List<AssetVendor>();
    }
}
