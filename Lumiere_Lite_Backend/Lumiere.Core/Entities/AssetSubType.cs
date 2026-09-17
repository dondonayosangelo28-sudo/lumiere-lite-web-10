using System;
using System.Collections.Generic;

namespace Lumiere.Core.Entities
{
    public class AssetSubType
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AssetTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public AssetType? AssetType { get; set; }
        public ICollection<Asset> Assets { get; set; } = new List<Asset>();
    }
}
