using Lumiere.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Lumiere.API.Middlewares
{
    public class EphemeralPermissionMiddleware
    {
        private readonly RequestDelegate _next;

        public EphemeralPermissionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    var now = DateTime.UtcNow;
                    var activePermissions = await dbContext.EphemeralPermissions
                        .Where(ep => ep.UserId == userId && ep.StartTimestamp <= now && ep.EndTimestamp > now)
                        .Select(ep => ep.TempRoleId.ToString())
                        .ToListAsync();

                    if (activePermissions.Any())
                    {
                        var identity = context.User.Identity as ClaimsIdentity;
                        if (identity != null)
                        {
                            // Merge temp role claims with permanent claims IN MEMORY ONLY
                            foreach (var roleId in activePermissions)
                            {
                                // Avoid adding duplicates if already present in JWT claims
                                if (!identity.HasClaim("ephemeral_role_ids", roleId))
                                {
                                    identity.AddClaim(new System.Security.Claims.Claim("ephemeral_role_ids", roleId));
                                }
                            }
                        }
                    }
                }
            }

            await _next(context);
        }
    }
}
