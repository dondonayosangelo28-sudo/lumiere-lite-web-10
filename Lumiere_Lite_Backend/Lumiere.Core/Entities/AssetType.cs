using System;
using System.Collections.Generic;

namespace Lumiere.Core.Entities
{
    public class AssetType
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<AssetSubType> SubTypes { get; set; } = new List<AssetSubType>();
    }
}
