using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumiere.Application.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;
        private readonly AppDbContext _context;

        public JwtService(IConfiguration configuration, IMemoryCache memoryCache, AppDbContext context)
        {
            _configuration = configuration;
            _memoryCache = memoryCache;
            _context = context;
        }

        public string GenerateToken(User user, Role role, IEnumerable<Guid> ephemeralRoleIds)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? string.Empty));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role_id", role.Id.ToString()),
                new Claim("role_name", role.Name)
            };

            foreach (var ephemeralRoleId in ephemeralRoleIds)
            {
                claims.Add(new Claim("ephemeral_role_ids", ephemeralRoleId.ToString()));
            }

            // Expiry logic: 12 hours for Admin/Executive/WOM, 8 hours default
            double expiryHours = (role.Name == "Admin" || role.Name == "SystemAdmin" || role.Name == "Executive" || role.Name == "Warehouse Operations Manager") ? 12 : 8;

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiryHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task BlacklistTokenAsync(string jti, DateTime expiresAt)
        {
            // Add to Memory Cache
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = expiresAt
            };
            _memoryCache.Set($"blacklist_{jti}", true, cacheOptions);

            // Add to Database
            var blacklistedToken = new BlacklistedToken
            {
                Jti = jti,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };
            _context.BlacklistedTokens.Add(blacklistedToken);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsTokenBlacklistedAsync(string jti)
        {
            if (_memoryCache.TryGetValue($"blacklist_{jti}", out _))
            {
                return true;
            }

            var existsInDb = await _context.BlacklistedTokens.AnyAsync(t => t.Jti == jti);
            if (existsInDb)
            {
                // Re-populate cache if it was evicted
                var token = await _context.BlacklistedTokens.FirstOrDefaultAsync(t => t.Jti == jti);
                if (token != null)
                {
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpiration = token.ExpiresAt
                    };
                    _memoryCache.Set($"blacklist_{jti}", true, cacheOptions);
                }
                return true;
            }

            return false;
        }
    }
}
