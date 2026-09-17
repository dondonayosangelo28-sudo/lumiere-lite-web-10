using System;

namespace Lumiere.Core.Entities
{
    public class VendorContactPlatform
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RepresentativeId { get; set; }
        public string PlatformType { get; set; } = string.Empty;
        public string PlatformValue { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public VendorRepresentative? Representative { get; set; }
    }
}
