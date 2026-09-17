using System;
using System.Collections.Generic;

namespace Lumiere.Core.Entities
{
    public class VendorRepresentative
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid VendorId { get; set; }
        public string RepresentativeName { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Vendor? Vendor { get; set; }
        public ICollection<VendorContactNumber> ContactNumbers { get; set; } = new List<VendorContactNumber>();
        public ICollection<VendorContactPlatform> Platforms { get; set; } = new List<VendorContactPlatform>();
    }
}
