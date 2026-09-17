using System;

namespace Lumiere.Core.Entities
{
    public class EphemeralPermission
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid TempRoleId { get; set; }
        public DateTime StartTimestamp { get; set; }
        public DateTime EndTimestamp { get; set; }
        public string AuthReason { get; set; } = string.Empty;
        public Guid GrantedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
        public Role? TempRole { get; set; }
        public User? Grantor { get; set; }
    }
}
