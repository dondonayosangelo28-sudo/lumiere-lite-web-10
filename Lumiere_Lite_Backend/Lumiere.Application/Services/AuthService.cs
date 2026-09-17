using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IMemoryCache _memoryCache;

        public AuthService(AppDbContext context, IJwtService jwtService, IMemoryCache memoryCache)
        {
            _context = context;
            _jwtService = jwtService;
            _memoryCache = memoryCache;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var emailToMatch = request.Email?.Trim().ToLower() ?? string.Empty;
            var cacheKey = $"lockout_{emailToMatch}";
            if (_memoryCache.TryGetValue(cacheKey, out int failedAttempts) && failedAttempts >= 5)
            {
                throw new UnauthorizedAccessException("Account is locked due to too many failed login attempts. Please try again in 15 minutes.");
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailToMatch);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                HandleFailedAttempt(cacheKey, failedAttempts);
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("User account is inactive.");
            }

            // Reset failed attempts on successful login
            _memoryCache.Remove(cacheKey);

            if (user.Role == null)
                throw new InvalidOperationException("User has no role assigned.");

            // Get currently active ephemeral roles
            var now = DateTime.UtcNow;
            var ephemeralRoleIds = await _context.EphemeralPermissions
                .Where(ep => ep.UserId == user.Id && ep.StartTimestamp <= now && ep.EndTimestamp > now)
                .Select(ep => ep.TempRoleId)
                .ToListAsync();

            var token = _jwtService.GenerateToken(user, user.Role, ephemeralRoleIds);

            return new AuthResponse
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                UserId = user.Id,
                Role = user.Role.Name
            };
        }

        public async Task LogoutAsync(string jti, DateTime expiresAt)
        {
            await _jwtService.BlacklistTokenAsync(jti, expiresAt);
        }

        public Task<AuthResponse> RefreshAsync(string token)
        {
            // Placeholder for refresh logic if needed. Usually entails checking a refresh token table and issuing a new JWT.
            throw new NotImplementedException();
        }

        private void HandleFailedAttempt(string cacheKey, int currentFailedAttempts)
        {
            var attempts = currentFailedAttempts + 1;
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15) // 15-minute lock after 5 fails
            };

            _memoryCache.Set(cacheKey, attempts, cacheOptions);
        }

        // Static helper for password validation (can be used during user registration or password reset)
        public static bool IsValidPassword(string password)
        {
            if (password.Length < 8) return false;
            if (!Regex.IsMatch(password, @"[A-Z]")) return false; // At least one uppercase
            if (!Regex.IsMatch(password, @"[a-z]")) return false; // At least one lowercase
            if (!Regex.IsMatch(password, @"[0-9]")) return false; // At least one number
            return true;
        }

        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        }
    }
}
