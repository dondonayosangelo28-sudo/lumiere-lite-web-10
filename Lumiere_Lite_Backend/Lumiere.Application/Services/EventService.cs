using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class EventService : IEventService
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public EventService(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<Guid> CreateEventAsync(CreateEventRequest request, Guid currentUserId)
        {
            if (request.ReturnDate == default)
                request.ReturnDate = request.DateOfEvent;

            if (request.IngressDate.Date < DateTime.UtcNow.Date)
                throw new ArgumentException("Ingress date must not be in the past.");

            if (request.ReturnDate.Date < request.DateOfEvent.Date)
                throw new ArgumentException("Return date must be on or after the date of event.");

            if (request.GeoClass != "Local" && request.GeoClass != "National")
                throw new ArgumentException("GeoClass must be Local or National.");

            int transitBufferDays = request.GeoClass == "Local" ? 1 : 3;

            // Check duplicate venue + overlapping date
            // The overlap condition for ranges [StartA, EndA] and [StartB, EndB] is: StartA <= EndB AND EndA >= StartB
            // For Event, Start = IngressDate, End = ReturnDate + TransitBufferDays (implicitly padded or just ReturnDate, FSD says overlapping date range)
            var overlapExists = await _context.Events.AnyAsync(e =>
                e.EventVenue == request.EventVenue &&
                e.IngressDate <= request.ReturnDate &&
                e.ReturnDate >= request.IngressDate);

            if (overlapExists)
                throw new InvalidOperationException("Duplicate event found for the same venue with overlapping dates.");

            bool isLossMaker = false;
            if (request.EstimatedRevenue.HasValue && request.EstimatedRevenue.Value <= 0)
            {
                isLossMaker = true;
            }

            var newEvent = new Event
            {
                Name = request.EventName,
                DateOfEvent = request.DateOfEvent,
                IngressDate = request.IngressDate,
                IngressTime = request.IngressTime,
                FullStop = request.FullStop,
                EventVenue = request.EventVenue,
                GeoClass = request.GeoClass,
                EventPegs = request.EventPegs,
                ColorPalette = request.ColorPalette,
                BrandingAndTextures = request.BrandingAndTextures,
                Notes = request.Notes,
                EstimatedRevenue = request.EstimatedRevenue,
                IsLossMaker = isLossMaker,
                MobilizationDate = request.IngressDate,
                ReturnDate = request.ReturnDate,
                Status = "Active",
                TransitBufferDays = transitBufferDays,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Events.Add(newEvent);

            var eventFinancials = new EventFinancials
            {
                EventId = newEvent.Id,
                QuotationAmount = 0.00m,
                EstimatedAssetCost = 0.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.EventFinancials.Add(eventFinancials);

            if (isLossMaker)
            {
                // Find Supervisor role ID
                var supervisorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Supervisor" || r.Name == "SystemAdmin");
                var roleId = supervisorRole?.Id; // We will just target the Supervisor role or similar.

                var notification = new Notification
                {
                    TargetRoleId = roleId,
                    Title = "Loss-Maker Event Initialized",
                    Message = $"Event '{newEvent.Name}' has been flagged as a loss-maker. Acknowledgment required.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "EVENT_INITIALIZED", "events", newEvent.Id, null, new { newEvent.Name, Venue = newEvent.EventVenue, newEvent.DateOfEvent });

            return newEvent.Id;
        }

        public async Task<PaginatedList<EventResponse>> GetEventsAsync(int page, int pageSize, string? statusFilter)
        {
            var query = _context.Events.AsQueryable();

            if (!string.IsNullOrEmpty(statusFilter))
                query = query.Where(e => e.Status == statusFilter);

            var totalCount = await query.CountAsync();
            
            var items = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventResponse
                {
                    Id = e.Id,
                    Name = e.Name,
                    DateOfEvent = e.DateOfEvent,
                    IngressDate = e.IngressDate,
                    ReturnDate = e.ReturnDate,
                    Venue = e.EventVenue,
                    GeoClass = e.GeoClass,
                    Status = e.Status,
                    IsLossMaker = e.IsLossMaker,
                    CreatedBy = e.CreatedBy,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return new PaginatedList<EventResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<EventResponse> GetEventByIdAsync(Guid eventId)
        {
            var e = await _context.Events.FindAsync(eventId);
            if (e == null) throw new KeyNotFoundException("Event not found.");

            return new EventResponse
            {
                Id = e.Id,
                Name = e.Name,
                DateOfEvent = e.DateOfEvent,
                IngressDate = e.IngressDate,
                ReturnDate = e.ReturnDate,
                Venue = e.EventVenue,
                GeoClass = e.GeoClass,
                Status = e.Status,
                IsLossMaker = e.IsLossMaker,
                CreatedBy = e.CreatedBy,
                CreatedAt = e.CreatedAt
            };
        }

        public async Task AcknowledgeLossMakerAsync(Guid eventId, Guid currentUserId)
        {
            var e = await _context.Events.FindAsync(eventId);
            if (e == null) throw new KeyNotFoundException("Event not found.");

            // Acknowledgment clears the flag
            e.IsLossMaker = false;
            e.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "LOSS_MAKER_ACKNOWLEDGED", "events", e.Id, null, null);
        }

        public async Task UpdateEventAsync(Guid eventId, UpdateEventRequest request, Guid currentUserId)
        {
            var e = await _context.Events.FindAsync(eventId);
            if (e == null) throw new KeyNotFoundException("Event not found.");

            var previousState = new { e.Name, Venue = e.EventVenue, e.Status, e.Notes };

            if (request.EventName != null) e.Name = request.EventName;
            if (request.EventVenue != null) e.EventVenue = request.EventVenue;
            if (request.Status != null) e.Status = request.Status;
            if (request.Notes != null) e.Notes = request.Notes;

            e.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "EVENT_UPDATED", "events", e.Id, previousState, new { e.Name, Venue = e.EventVenue, e.Status, e.Notes });
        }

        public async Task GrantCanvasAccessAsync(Guid eventId, GrantCanvasAccessRequest request, Guid grantingUserId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) throw new KeyNotFoundException("Event not found.");
            if (ev.Status != "Active") throw new InvalidOperationException("Cannot grant canvas access for a non-active event.");

            var grantingUser = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == grantingUserId);
            if (grantingUser == null) throw new KeyNotFoundException("Granting user not found.");

            // Must be creator or Supervisor/SystemAdmin
            if (ev.CreatedBy != grantingUserId && grantingUser.Role?.Name != "Supervisor" && grantingUser.Role?.Name != "SystemAdmin")
            {
                throw new UnauthorizedAccessException("User is not authorized to grant access to this event canvas.");
            }

            var targetUser = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == request.Email);
            if (targetUser == null) throw new KeyNotFoundException("Target user with this email not found.");
            if (!targetUser.IsActive) throw new InvalidOperationException("Target user is inactive.");

            // Check if active grant already exists
            var existingGrant = await _context.EventViewers
                .FirstOrDefaultAsync(v => v.EventId == eventId && v.UserId == targetUser.Id && v.RevokedAt == null);

            if (existingGrant != null)
            {
                throw new InvalidOperationException("An active access grant already exists for this user and event. Please modify the existing grant.");
            }

            var viewerRecord = new EventViewer
            {
                ViewerId = Guid.NewGuid(),
                EventId = eventId,
                UserId = targetUser.Id,
                AccessLevel = request.AccessLevel,
                GrantedBy = grantingUserId,
                GrantedAt = DateTime.UtcNow
            };

            _context.EventViewers.Add(viewerRecord);

            var notification = new Notification
            {
                TargetUserId = targetUser.Id,
                Title = "Canvas Access Granted",
                Message = $"You have been granted '{request.AccessLevel}' access to the staging canvas for event '{ev.Name}'.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                grantingUserId, 
                "CANVAS_ACCESS_GRANT", 
                "event_viewers", 
                eventId, 
                null, 
                new { viewerRecord.ViewerId, targetUser.Id, request.AccessLevel }
            );
        }

        public async Task ModifyCanvasAccessAsync(Guid eventId, Guid targetUserId, ModifyCanvasAccessRequest request, Guid modifyingUserId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) throw new KeyNotFoundException("Event not found.");

            var modifyingUser = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == modifyingUserId);
            if (modifyingUser == null) throw new KeyNotFoundException("Modifying user not found.");

            // Must be creator or Supervisor/SystemAdmin
            if (ev.CreatedBy != modifyingUserId && modifyingUser.Role?.Name != "Supervisor" && modifyingUser.Role?.Name != "SystemAdmin")
            {
                throw new UnauthorizedAccessException("User is not authorized to modify access to this event canvas.");
            }

            var activeGrant = await _context.EventViewers
                .FirstOrDefaultAsync(v => v.EventId == eventId && v.UserId == targetUserId && v.RevokedAt == null);

            if (activeGrant == null)
            {
                throw new KeyNotFoundException("No active canvas access grant found for this user and event.");
            }

            var previousState = new { activeGrant.AccessLevel };
            activeGrant.AccessLevel = request.AccessLevel;

            var notification = new Notification
            {
                TargetUserId = targetUserId,
                Title = "Canvas Access Modified",
                Message = $"Your access level to the staging canvas for event '{ev.Name}' has been updated to '{request.AccessLevel}'.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                modifyingUserId,
                "CANVAS_ACCESS_MODIFIED",
                "event_viewers",
                eventId,
                previousState,
                new { activeGrant.ViewerId, targetUserId, request.AccessLevel }
            );
        }

        public async Task RevokeCanvasAccessAsync(Guid eventId, Guid targetUserId, Guid revokingUserId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) throw new KeyNotFoundException("Event not found.");

            var revokingUser = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == revokingUserId);
            if (revokingUser == null) throw new KeyNotFoundException("Revoking user not found.");

            var activeGrant = await _context.EventViewers
                .FirstOrDefaultAsync(v => v.EventId == eventId && v.UserId == targetUserId && v.RevokedAt == null);

            if (activeGrant == null)
            {
                throw new KeyNotFoundException("No active canvas access grant found for this user and event.");
            }

            // Revocation requires original granter or a Supervisor/SystemAdmin
            if (activeGrant.GrantedBy != revokingUserId && revokingUser.Role?.Name != "Supervisor" && revokingUser.Role?.Name != "SystemAdmin")
            {
                throw new UnauthorizedAccessException("User is not authorized to revoke access. Only the original granter or a Supervisor can perform this action.");
            }

            var previousState = new { activeGrant.RevokedBy, activeGrant.RevokedAt };
            activeGrant.RevokedBy = revokingUserId;
            activeGrant.RevokedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                TargetUserId = targetUserId,
                Title = "Canvas Access Revoked",
                Message = $"Your access to the staging canvas for event '{ev.Name}' has been revoked.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                revokingUserId,
                "CANVAS_ACCESS_REVOKED",
                "event_viewers",
                eventId,
                previousState,
                new { activeGrant.ViewerId, targetUserId, activeGrant.RevokedBy, activeGrant.RevokedAt }
            );
        }

        public async Task<System.Collections.Generic.List<EventViewerResponse>> GetActiveCanvasViewersAsync(Guid eventId)
        {
            var viewers = await _context.EventViewers
                .Include(ev => ev.User)
                .Where(ev => ev.EventId == eventId && ev.RevokedAt == null)
                .Select(ev => new EventViewerResponse
                {
                    ViewerId = ev.ViewerId,
                    EventId = ev.EventId,
                    UserId = ev.UserId,
                    UserEmail = ev.User != null ? ev.User.Email : string.Empty,
                    UserFullName = ev.User != null ? ev.User.FullName : string.Empty,
                    AccessLevel = ev.AccessLevel,
                    GrantedBy = ev.GrantedBy,
                    GrantedAt = ev.GrantedAt
                })
                .ToListAsync();

            return viewers;
        }
    }
}
