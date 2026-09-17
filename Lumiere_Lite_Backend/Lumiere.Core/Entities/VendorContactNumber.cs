using System;

namespace Lumiere.Core.Entities
{
    public class VendorContactNumber
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RepresentativeId { get; set; }
        public string ContactNumber { get; set; } = string.Empty;
        public string? NumberLabel { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public VendorRepresentative? Representative { get; set; }
    }
}
