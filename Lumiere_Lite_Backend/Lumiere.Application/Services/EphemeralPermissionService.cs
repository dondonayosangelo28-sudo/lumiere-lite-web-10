using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class EphemeralPermissionService : IEphemeralPermissionService
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public EphemeralPermissionService(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<Guid> GrantPermissionAsync(GrantEphemeralPermissionRequest request, Guid currentUserId)
        {
            if (request.EndTimestamp <= request.StartTimestamp)
                throw new ArgumentException("End timestamp must be after start timestamp.");

            if (request.EndTimestamp <= DateTime.UtcNow)
                throw new ArgumentException("End timestamp must be in the future.");

            var targetUser = await _context.Users.FindAsync(request.TargetUserId);
            if (targetUser == null || !targetUser.IsActive)
                throw new InvalidOperationException("Target user is either invalid or inactive.");

            var now = DateTime.UtcNow;
            var activeDuplicate = await _context.EphemeralPermissions.AnyAsync(ep =>
                ep.UserId == request.TargetUserId &&
                ep.TempRoleId == request.TempRoleId &&
                ep.StartTimestamp <= request.EndTimestamp &&
                ep.EndTimestamp >= request.StartTimestamp);

            if (activeDuplicate)
                throw new InvalidOperationException("Duplicate active grant found for this user and role combination.");

            var permission = new EphemeralPermission
            {
                UserId = request.TargetUserId,
                TempRoleId = request.TempRoleId,
                StartTimestamp = request.StartTimestamp,
                EndTimestamp = request.EndTimestamp,
                AuthReason = request.AuthReason,
                GrantedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EphemeralPermissions.Add(permission);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                currentUserId,
                "EPHEMERAL_GRANT",
                "ephemeral_permissions",
                permission.Id,
                null,
                new { permission.UserId, permission.TempRoleId, StartTime = permission.StartTimestamp, EndTime = permission.EndTimestamp, Reason = permission.AuthReason }
            );

            return permission.Id;
        }

        public async Task RevokePermissionAsync(Guid permId, Guid currentUserId)
        {
            var permission = await _context.EphemeralPermissions.FindAsync(permId);
            if (permission == null)
                throw new KeyNotFoundException("Permission not found.");

            // Early revocation
            permission.EndTimestamp = DateTime.UtcNow;
            permission.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                currentUserId,
                "EPHEMERAL_REVOKED",
                "ephemeral_permissions",
                permission.Id,
                null,
                new { RevokedAt = permission.EndTimestamp }
            );
        }

        public async Task<IEnumerable<object>> GetActivePermissionsAsync()
        {
            var now = DateTime.UtcNow;
            var activePermissions = await _context.EphemeralPermissions
                .Include(ep => ep.User)
                .Include(ep => ep.TempRole)
                .Where(ep => ep.StartTimestamp <= now && ep.EndTimestamp > now)
                .Select(ep => new
                {
                    ep.Id,
                    UserEmail = ep.User.Email,
                    RoleName = ep.TempRole.Name,
                    StartTime = ep.StartTimestamp,
                    EndTime = ep.EndTimestamp,
                    Reason = ep.AuthReason,
                    RemainingMinutes = (ep.EndTimestamp - now).TotalMinutes
                })
                .ToListAsync();

            return activePermissions;
        }
    }
}
