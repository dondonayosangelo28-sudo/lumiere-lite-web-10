using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class PackingListResponse
    {
        public Guid EventId { get; set; }
        public List<AssetGroupDto> Groups { get; set; } = new List<AssetGroupDto>();
    }

    public class AssetGroupDto
    {
        public string AssetTypeName { get; set; } = string.Empty;
        public int AssetTier { get; set; }
        public List<PackingListAssetDto> Assets { get; set; } = new List<PackingListAssetDto>();
    }

    public class PackingListAssetDto
    {
        public Guid AssetId { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public string CurrentState { get; set; } = string.Empty;
    }

    public class VerifyItemRequest
    {
        [Required]
        public Guid AssetId { get; set; }
    }

    public class VerifyItemResponse
    {
        public bool IsBatchComplete { get; set; }
    }

    public class UpdateAssetStateRequest
    {
        [Required]
        public string TargetState { get; set; } = string.Empty;
        public Guid? EventId { get; set; }
    }
}
