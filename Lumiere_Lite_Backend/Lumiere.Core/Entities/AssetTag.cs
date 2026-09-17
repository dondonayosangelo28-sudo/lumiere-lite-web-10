using System;

namespace Lumiere.Core.Entities
{
    public class AssetTag
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AssetId { get; set; }
        public string TagValue { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Asset? Asset { get; set; }
    }
}
