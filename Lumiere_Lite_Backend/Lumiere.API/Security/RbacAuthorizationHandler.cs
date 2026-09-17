using Microsoft.AspNetCore.Authorization;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Lumiere.API.Security
{
    public class RbacRequirement : IAuthorizationRequirement
    {
        public string RequiredRole { get; }
        public RbacRequirement(string requiredRole)
        {
            RequiredRole = requiredRole;
        }
    }

    public class RbacAuthorizationHandler : AuthorizationHandler<RbacRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RbacRequirement requirement)
        {
            if (!context.User.Identity?.IsAuthenticated ?? true)
            {
                return Task.CompletedTask;
            }

            // Extract all role names (permanent and ephemeral)
            var roleNames = context.User.FindAll("role_name").Select(c => c.Value).ToList();
            if (context.User.HasClaim(c => c.Type == ClaimTypes.Role))
            {
                roleNames.AddRange(context.User.FindAll(ClaimTypes.Role).Select(c => c.Value));
            }
            roleNames = roleNames.Distinct().ToList();

            // Check if any role matches directly (or carries administrative override)
            if (roleNames.Contains(requirement.RequiredRole) || roleNames.Contains("Admin") || roleNames.Contains("SystemAdmin"))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Check hierarchy on any of the resolved roles
            string[] hierarchy = { "SystemAdmin", "Supervisor", "WarehouseSupervisor", "FrontOfficePlanner" };
            int requiredRoleIndex = System.Array.IndexOf(hierarchy, requirement.RequiredRole);

            if (requiredRoleIndex >= 0)
            {
                foreach (var role in roleNames)
                {
                    int userRoleIndex = System.Array.IndexOf(hierarchy, role);
                    if (userRoleIndex >= 0 && userRoleIndex <= requiredRoleIndex)
                    {
                        context.Succeed(requirement);
                        return Task.CompletedTask;
                    }
                }
            }

            return Task.CompletedTask;
        }
    }
}
