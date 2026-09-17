using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class ReservationService : IReservationService
    {
        private readonly AppDbContext _context;
        private readonly Supabase.Client _supabaseClient;

        public ReservationService(AppDbContext context, Supabase.Client supabaseClient)
        {
            _context = context;
            _supabaseClient = supabaseClient;
        }

        public async Task<BulkReservationResponse> ReserveAssetsBulkAsync(BulkReservationRequest request, Guid currentUserId)
        {
            if (request.LockEnd <= request.LockStart)
                throw new ArgumentException("LockEnd must be strictly greater than LockStart.");

            var ev = await _context.Events.FindAsync(request.EventId);
            if (ev == null || ev.Status != "Active")
                throw new InvalidOperationException("Event does not exist or is not Active.");

            var uniqueAssetIds = request.AssetIds.Distinct().ToList();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var conflicts = await CheckTemporalOverlap(request.EventId, uniqueAssetIds, request.LockStart, request.LockEnd);
                if (conflicts.Any())
                {
                    throw new TemporalConflictException("Conflict detected during temporal validation.", conflicts);
                }

                var (windowStart, windowEnd) = await GetExtendedWindowAsync(request.EventId, request.LockStart, request.LockEnd);
                var reservationIds = new List<Guid>();

                foreach (var assetId in uniqueAssetIds)
                {
                    var asset = await _context.Assets.FindAsync(assetId);
                    if (asset == null)
                        throw new KeyNotFoundException($"Asset ID {assetId} not found in the registry.");

                    var reservation = new AssetReservation
                    {
                        EventId = request.EventId,
                        AssetId = assetId,
                        LockStart = windowStart,
                        LockEnd = windowEnd,
                        Status = "Committed",
                        ReservedBy = currentUserId,
                        ReservedAt = DateTimeOffset.UtcNow
                    };

                    _context.AssetReservations.Add(reservation);
                    reservationIds.Add(reservation.Id);

                    asset.AssetState = "Committed";
                    asset.UpdatedAt = DateTime.UtcNow;

                    _context.AuditLogs.Add(new AuditLog
                    {
                        AffectedTable = "assets",
                        AffectedRecordId = assetId,
                        ActionType = "RESERVATION_STAGED",
                        ActorId = currentUserId,
                        NewState = JsonSerializer.SerializeToDocument(new { AssetState = "Committed", EventId = request.EventId }),
                        LoggedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (_supabaseClient != null)
                {
                    try
                    {
                        foreach (var assetId in uniqueAssetIds)
                        {
                            await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                                Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                                "state_update",
                                new { asset_id = assetId, new_state = "Committed", timestamp = DateTime.UtcNow }
                            );
                        }
                    }
                    catch
                    {
                        // Realtime broadcast fails only as a warning after DB commit succeeded
                    }
                }

                return new BulkReservationResponse { ReservationIds = reservationIds };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<(DateTimeOffset WindowStart, DateTimeOffset WindowEnd)> GetExtendedWindowAsync(Guid eventId, DateTimeOffset lockStart, DateTimeOffset lockEnd)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null)
            {
                return (lockStart.AddDays(-1), lockEnd.AddDays(1)); // Default to Local buffer
            }

            int startBuffer = ev.GeoClass.Equals("National", StringComparison.OrdinalIgnoreCase) ? 3 : 1;
            int endBuffer = ev.GeoClass.Equals("National", StringComparison.OrdinalIgnoreCase) ? 5 : 1;

            return (lockStart.AddDays(-startBuffer), lockEnd.AddDays(endBuffer));
        }

        private async Task<List<AssetConflictDetail>> CheckTemporalOverlap(Guid eventId, List<Guid> assetIds, DateTimeOffset lockStart, DateTimeOffset lockEnd)
        {
            var (windowStart, windowEnd) = await GetExtendedWindowAsync(eventId, lockStart, lockEnd);

            var activeOverlaps = await _context.AssetReservations
                .Where(ar => assetIds.Contains(ar.AssetId) &&
                             ar.Status != "Cancelled" &&
                             ar.LockStart <= windowEnd &&
                             ar.LockEnd >= windowStart)
                .ToListAsync();

            return activeOverlaps.Select(overlap => new AssetConflictDetail
            {
                AssetId = overlap.AssetId,
                ConflictingEventId = overlap.EventId,
                ConflictingLockStart = overlap.LockStart,
                ConflictingLockEnd = overlap.LockEnd
            }).ToList();
        }

        public async Task<List<ReservationResponse>> GetReservationsByEventAsync(Guid eventId)
        {
            var reservations = await _context.AssetReservations
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.LockStart)
                .ToListAsync();

            return reservations.Select(r => new ReservationResponse
            {
                Id = r.Id,
                EventId = r.EventId,
                AssetId = r.AssetId,
                LockStart = r.LockStart,
                LockEnd = r.LockEnd,
                Status = r.Status
            }).ToList();
        }

        public async Task ReleaseReservationAsync(Guid reservationId, Guid currentUserId)
        {
            var reservation = await _context.AssetReservations.FindAsync(reservationId);
            if (reservation == null)
                throw new KeyNotFoundException("Reservation not found.");

            if (reservation.Status == "Cancelled")
                return;

            reservation.Status = "Cancelled";
            reservation.UpdatedAt = DateTimeOffset.UtcNow;

            var asset = await _context.Assets.FindAsync(reservation.AssetId);
            if (asset != null && asset.AssetState == "Committed")
            {
                asset.AssetState = "Available";
                asset.UpdatedAt = DateTime.UtcNow;
            }

            _context.AuditLogs.Add(new AuditLog
            {
                AffectedTable = "assets",
                AffectedRecordId = reservation.AssetId,
                ActionType = "RESERVATION_RELEASED",
                ActorId = currentUserId,
                NewState = JsonSerializer.SerializeToDocument(new { AssetState = "Available" }),
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            if (asset != null && _supabaseClient != null)
            {
                try
                {
                    await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                        Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                        "state_update",
                        new { asset_id = asset.Id, new_state = asset.AssetState, timestamp = DateTime.UtcNow }
                    );
                }
                catch
                {
                    // Realtime broadcast fails only as a warning after DB commit succeeded
                }
            }
        }

        public async Task<CanvasValidationResponse> ValidateCanvasStateAsync(CanvasValidationRequest request)
        {
            var uniqueAssetIds = request.AssetIds.Distinct().ToList();

            var (windowStart, windowEnd) = request.EventId.HasValue
                ? await GetExtendedWindowAsync(request.EventId.Value, request.LockStart, request.LockEnd)
                : (request.LockStart.AddDays(-1), request.LockEnd.AddDays(1));

            var activeOverlaps = await _context.AssetReservations
                .Where(ar => uniqueAssetIds.Contains(ar.AssetId) &&
                             ar.Status != "Cancelled" &&
                             ar.LockStart <= windowEnd &&
                             ar.LockEnd >= windowStart)
                .Select(ar => ar.AssetId)
                .Distinct()
                .ToListAsync();

            var availableAssetIds = uniqueAssetIds.Except(activeOverlaps).ToList();

            return new CanvasValidationResponse
            {
                AvailableAssetIds = availableAssetIds,
                ConflictedAssetIds = activeOverlaps
            };
        }
    }
}
