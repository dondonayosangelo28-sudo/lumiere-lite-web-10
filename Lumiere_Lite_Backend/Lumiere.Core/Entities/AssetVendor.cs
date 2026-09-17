using System;

namespace Lumiere.Core.Entities
{
    public class AssetVendor
    {
        public Guid AssetId { get; set; }
        public Guid VendorId { get; set; }
        public DateTime? RentalPeriodStart { get; set; }
        public DateTime? RentalPeriodEnd { get; set; }
        public decimal? RentalCost { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Asset? Asset { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
