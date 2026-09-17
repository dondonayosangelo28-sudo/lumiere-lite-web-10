using Lumiere.Core.DTOs;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Lumiere.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly Microsoft.Extensions.Hosting.IHostEnvironment _env;

        public AuthController(IAuthService authService, Microsoft.Extensions.Hosting.IHostEnvironment env)
        {
            _authService = authService;
            _env = env;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("login-debug")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginDebug([FromBody] LoginRequest request, [FromServices] AppDbContext context)
        {
            if (_env.IsProduction())
            {
                return NotFound(new { Error = "login-debug endpoint is disabled in Production environment." });
            }

            try
            {
                var user = await context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == request.Email.Trim().ToLower());

                if (user == null)
                {
                    return NotFound(new { 
                        DiagnosticError = "User not found in database.", 
                        EmailAttempted = request.Email 
                    });
                }

                var hash = user.PasswordHash;
                if (string.IsNullOrEmpty(hash) || (!hash.StartsWith("$2a$") && !hash.StartsWith("$2b$") && !hash.StartsWith("$2y$")))
                {
                    return BadRequest(new { 
                        DiagnosticError = "Database password hash is not a valid BCrypt string.",
                        HashLength = hash?.Length ?? 0,
                        HashStart = hash != null && hash.Length > 5 ? hash.Substring(0, 5) : "N/A"
                    });
                }

                bool passwordMatches;
                try 
                {
                    passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, hash);
                }
                catch (Exception bcryptEx)
                {
                    return BadRequest(new { 
                        DiagnosticError = $"BCrypt validation threw an exception: {bcryptEx.Message}"
                    });
                }

                if (!passwordMatches)
                {
                    return Unauthorized(new { DiagnosticError = "Password verification failed." });
                }

                if (user.Role == null)
                {
                    return BadRequest(new { DiagnosticError = "User exists and authenticated, but has no Role assigned." });
                }

                return Ok(new {
                    Message = "Authentication verification successful.",
                    UserEmail = user.Email,
                    UserFullName = user.FullName,
                    RoleName = user.Role.Name,
                    IsActive = user.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    DiagnosticError = $"Global exception during audit: {ex.Message}", 
                    StackTrace = ex.StackTrace 
                });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            var expClaim = User.FindFirst("exp")?.Value;

            if (!string.IsNullOrEmpty(jti) && expClaim != null && long.TryParse(expClaim, out long expSeconds))
            {
                var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
                await _authService.LogoutAsync(jti, expiresAt);
            }

            return Ok(new { Message = "Logged out successfully." });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public IActionResult Refresh()
        {
            // Placeholder for refresh token logic. Usually relies on an HTTP-only cookie with a refresh token.
            return StatusCode(501, new { Error = "Not implemented yet." });
        }
    }
}
