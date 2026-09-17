using Lumiere.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;

namespace Lumiere.API.Middlewares
{
    public class TokenBlacklistMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenBlacklistMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IJwtService jwtService)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var jti = context.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (!string.IsNullOrEmpty(jti))
                {
                    var isBlacklisted = await jwtService.IsTokenBlacklistedAsync(jti);
                    if (isBlacklisted)
                    {
                        context.Response.StatusCode = 401; // Unauthorized
                        await context.Response.WriteAsJsonAsync(new { Error = "Token has been revoked." });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
