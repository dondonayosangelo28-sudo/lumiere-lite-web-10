using System;
using System.Collections.Generic;

namespace Lumiere.Core.Entities
{
    public class Vendor
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string VendorName { get; set; } = string.Empty;
        public string? Address { get; set; } // address is in DB schema or keep it
        public string? VendorNotes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorRepresentative> Representatives { get; set; } = new List<VendorRepresentative>();
    }
}
