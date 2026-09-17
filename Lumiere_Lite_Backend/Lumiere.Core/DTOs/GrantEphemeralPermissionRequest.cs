using System;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class GrantEphemeralPermissionRequest
    {
        [Required]
        public Guid TargetUserId { get; set; }
        
        [Required]
        public Guid TempRoleId { get; set; }
        
        [Required]
        public DateTime StartTimestamp { get; set; }
        
        [Required]
        public DateTime EndTimestamp { get; set; }
        
        [Required]
        public string AuthReason { get; set; } = string.Empty;
    }
}
