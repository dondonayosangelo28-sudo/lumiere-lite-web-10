using Lumiere.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Core.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user, Role role, IEnumerable<Guid> ephemeralRoleIds);
        Task BlacklistTokenAsync(string jti, DateTime expiresAt);
        Task<bool> IsTokenBlacklistedAsync(string jti);
    }
}
