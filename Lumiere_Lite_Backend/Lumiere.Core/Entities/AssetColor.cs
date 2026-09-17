using System;

namespace Lumiere.Core.Entities
{
    public class AssetColor
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AssetId { get; set; }
        public string HexValue { get; set; } = string.Empty;
        public string? PaintBrand { get; set; }
        public string? MaterialFinish { get; set; }
        public int ColorOrder { get; set; } = 1;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Asset? Asset { get; set; }
    }
}
