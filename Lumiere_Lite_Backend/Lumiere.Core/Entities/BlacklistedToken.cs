using System;

namespace Lumiere.Core.Entities
{
    public class BlacklistedToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Jti { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
