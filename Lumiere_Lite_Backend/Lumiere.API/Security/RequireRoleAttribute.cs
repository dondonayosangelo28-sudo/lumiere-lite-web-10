using Microsoft.AspNetCore.Authorization;

namespace Lumiere.API.Security
{
    public class RequireRoleAttribute : AuthorizeAttribute
    {
        public const string PolicyPrefix = "RequireRole_";

        public RequireRoleAttribute(string roleName)
        {
            RoleName = roleName;
            Policy = $"{PolicyPrefix}{roleName}";
        }

        public string RoleName { get; }
    }
}
