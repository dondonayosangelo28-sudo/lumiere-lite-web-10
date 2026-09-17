using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class CreateAssetRequest
    {
        [Required]
        public Guid AssetSubTypeId { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int AssetTier { get; set; }
        
        [Range(1, 10000)]
        public int Quantity { get; set; } = 1;
        
        public string? CatalogPhotoUrl { get; set; }
    }

    public class UpdateAssetRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? Quantity { get; set; }
        public string? CatalogPhotoUrl { get; set; }
    }

    public class TransitionStateRequest
    {
        [Required]
        public string TargetState { get; set; } = string.Empty;
        public Guid? EventId { get; set; }
        public bool OverrideFlag { get; set; } = false;
    }

    public class SalvageAssetRequest
    {
        [Required]
        [Range(1, 5)]
        public int NewTier { get; set; }
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    public class AddColorRequest
    {
        [Required]
        [RegularExpression("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", ErrorMessage = "Invalid hex color code.")]
        public string HexCode { get; set; } = string.Empty;
        public string? PaintBrand { get; set; }
        public string? MaterialFinish { get; set; }
    }

    public class AddTagRequest
    {
        [Required]
        public string TagName { get; set; } = string.Empty;
    }

    public class AssetResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int AssetTier { get; set; }
        public string AssetState { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    public class AssetDetailResponse : AssetResponse
    {
        public string? Description { get; set; }
        public string? CatalogPhotoUrl { get; set; }
        public List<AssetColorDto> Colors { get; set; } = new List<AssetColorDto>();
        public List<string> Tags { get; set; } = new List<string>();
        // Vendor info can also be added here
    }

    public class AssetColorDto
    {
        public string HexCode { get; set; } = string.Empty;
        public string? PaintBrand { get; set; }
        public string? MaterialFinish { get; set; }
    }
}
