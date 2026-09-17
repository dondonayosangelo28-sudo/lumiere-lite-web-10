using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.API.Security
{
    public class EphemeralClaimsTransformation : IClaimsTransformation
    {
        private readonly AppDbContext _dbContext;

        public EphemeralClaimsTransformation(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // If the identity is not authenticated, do not transform.
            if (principal.Identity?.IsAuthenticated != true)
            {
                return principal;
            }

            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null)
            {
                return principal;
            }

            // Extract the user ID from the principal's claims
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return principal;
            }

            var now = DateTime.UtcNow;

            // Fetch any active ephemeral permissions for the user and include the Role details
            var activePermissions = await _dbContext.EphemeralPermissions
                .Include(ep => ep.TempRole)
                .Where(ep => ep.UserId == userId && ep.StartTimestamp <= now && ep.EndTimestamp > now)
                .ToListAsync();

            foreach (var ep in activePermissions)
            {
                if (ep.TempRole != null)
                {
                    // Merge temporary role ID
                    if (!identity.HasClaim("ephemeral_role_ids", ep.TempRoleId.ToString()))
                    {
                        identity.AddClaim(new Claim("ephemeral_role_ids", ep.TempRoleId.ToString()));
                    }

                    // Merge temporary role name into standard role claims so standard policies work
                    if (!identity.HasClaim(ClaimTypes.Role, ep.TempRole.Name))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, ep.TempRole.Name));
                    }

                    // Also merge into the role_name claim checked by custom RbacAuthorizationHandler
                    if (!identity.HasClaim("role_name", ep.TempRole.Name))
                    {
                        identity.AddClaim(new Claim("role_name", ep.TempRole.Name));
                    }
                }
            }

            return principal;
        }
    }
}
