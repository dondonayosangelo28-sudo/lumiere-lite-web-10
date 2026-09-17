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
    public class DispatchService : IDispatchService
    {
        private readonly AppDbContext _context;
        private readonly Supabase.Client _supabaseClient;

        public DispatchService(AppDbContext context, Supabase.Client supabaseClient)
        {
            _context = context;
            _supabaseClient = supabaseClient;
        }

        public async Task<PackingListResponse> GetPackingListAsync(Guid eventId)
        {
            var reservations = await _context.AssetReservations
                .Include(r => r.Asset)
                .ThenInclude(a => a.AssetSubType)
                .ThenInclude(ast => ast.AssetType)
                .Where(r => r.EventId == eventId && r.Status != "Cancelled")
                .ToListAsync();

            var grouped = reservations
                .GroupBy(r => new { Name = r.Asset?.AssetSubType?.AssetType?.Name ?? "General Equipment", AssetTier = r.Asset?.AssetTier ?? 1 })
                .Select(g => new AssetGroupDto
                {
                    AssetTypeName = g.Key.Name,
                    AssetTier = g.Key.AssetTier,
                    Assets = g.Select(r => new PackingListAssetDto
                    {
                        AssetId = r.AssetId,
                        AssetName = r.Asset?.Name ?? "Unknown Asset",
                        CurrentState = r.Asset?.AssetState ?? "Unknown"
                    }).ToList()
                })
                .ToList();

            return new PackingListResponse
            {
                EventId = eventId,
                Groups = grouped
            };
        }

        public async Task PrepareDispatchAsync(Guid eventId, Guid currentUserId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null || ev.Status != "Active")
                throw new InvalidOperationException("Event is not Active.");

            var queueRecord = await _context.DispatchPreparationQueue
                .FirstOrDefaultAsync(q => q.EventId == eventId && q.PrepStatus != "Dispatched");

            if (queueRecord != null)
                throw new InvalidOperationException("Event is already in the dispatch queue.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Ensure a canvas exists for this event
                var canvas = await _context.EventCanvases.FirstOrDefaultAsync(c => c.EventId == eventId);
                if (canvas == null)
                {
                    canvas = new EventCanvas
                    {
                        EventId = eventId,
                        CanvasState = "{}",
                        AnnotationState = "{}",
                        CanvasMode = "PDF",
                        CanvasStatus = "Approved"
                    };
                    _context.EventCanvases.Add(canvas);
                    await _context.SaveChangesAsync();
                }
                var canvasId = canvas.Id;

                var committedReservations = await _context.AssetReservations
                    .Include(r => r.Asset)
                    .Where(r => r.EventId == eventId && r.Status != "Cancelled" && r.Asset != null && r.Asset.AssetState == "Committed")
                    .ToListAsync();

                if (!committedReservations.Any())
                {
                    throw new InvalidOperationException("No committed asset reservations found for this event to prepare.");
                }

                foreach (var reservation in committedReservations)
                {
                    reservation.Asset.AssetState = "Prepping";
                    reservation.Asset.UpdatedAt = DateTime.UtcNow;

                    var newQueue = new DispatchPreparationQueue
                    {
                        EventId = eventId,
                        CanvasId = canvasId,
                        AssetId = reservation.AssetId,
                        QuantityRequired = 1,
                        PrepStatus = "Prepping",
                        AssignedTo = currentUserId
                    };
                    _context.DispatchPreparationQueue.Add(newQueue);
                }

                _context.AuditLogs.Add(new AuditLog
                {
                    AffectedTable = "dispatch_preparation_queue",
                    AffectedRecordId = eventId,
                    ActionType = "DISPATCH_PREP_STARTED",
                    ActorId = currentUserId,
                    NewState = JsonSerializer.SerializeToDocument(new { Status = "Prepping", EventId = eventId }),
                    LoggedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (_supabaseClient != null)
                {
                    try
                    {
                        foreach (var reservation in committedReservations)
                        {
                            await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                                Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                                "state_update",
                                new { asset_id = reservation.AssetId, new_state = "Prepping", timestamp = DateTime.UtcNow }
                            );
                        }
                    }
                    catch
                    {
                        // Realtime broadcast fails only as a warning after DB commit succeeded
                    }
                }
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<VerifyItemResponse> VerifyItemAsync(Guid eventId, Guid assetId, Guid currentUserId)
        {
            var reservation = await _context.AssetReservations
                .Include(r => r.Asset)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.AssetId == assetId && r.Status != "Cancelled");

            if (reservation == null)
                throw new KeyNotFoundException("Asset not found in this event's active reservations.");

            if (reservation.Asset.AssetState != "Prepping")
                throw new InvalidOperationException($"Asset state is '{reservation.Asset.AssetState}', expected 'Prepping'.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                reservation.Asset.AssetState = "In-Transit Outbound";
                reservation.Asset.UpdatedAt = DateTime.UtcNow;

                _context.AuditLogs.Add(new AuditLog
                {
                    AffectedTable = "assets",
                    AffectedRecordId = assetId,
                    ActionType = "ITEM_DISPATCH_VERIFIED",
                    ActorId = currentUserId,
                    NewState = JsonSerializer.SerializeToDocument(new { AssetState = "In-Transit Outbound" }),
                    LoggedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                // Check remaining
                var remainingPrepping = await _context.AssetReservations
                    .Include(r => r.Asset)
                    .Where(r => r.EventId == eventId && r.Status != "Cancelled" && r.Asset.AssetState == "Prepping")
                    .AnyAsync();

                if (!remainingPrepping)
                {
                    var queueRecords = await _context.DispatchPreparationQueue
                        .Where(q => q.EventId == eventId && q.PrepStatus == "Prepping")
                        .ToListAsync();

                    foreach (var queueRecord in queueRecords)
                    {
                        queueRecord.PrepStatus = "Dispatched";
                        queueRecord.UpdatedAt = DateTimeOffset.UtcNow;

                        _context.AuditLogs.Add(new AuditLog
                        {
                            AffectedTable = "dispatch_preparation_queue",
                            AffectedRecordId = queueRecord.Id,
                            ActionType = "EVENT_FULLY_DISPATCHED",
                            ActorId = currentUserId,
                            NewState = JsonSerializer.SerializeToDocument(new { Status = "Dispatched" }),
                            LoggedAt = DateTime.UtcNow
                        });
                    }

                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                if (_supabaseClient != null)
                {
                    try
                    {
                        await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                            Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                            "state_update",
                            new { asset_id = assetId, new_state = "In-Transit Outbound", timestamp = DateTime.UtcNow }
                        );
                    }
                    catch
                    {
                        // Realtime broadcast fails only as a warning after DB commit succeeded
                    }
                }

                return new VerifyItemResponse { IsBatchComplete = !remainingPrepping };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task ForceDispatchAsync(Guid eventId, Guid currentUserId)
        {
            var queueRecords = await _context.DispatchPreparationQueue
                .Where(q => q.EventId == eventId && q.PrepStatus == "Prepping")
                .ToListAsync();

            if (!queueRecords.Any())
                throw new InvalidOperationException("No active preparation queue found for this event.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var preppingReservations = await _context.AssetReservations
                    .Include(r => r.Asset)
                    .Where(r => r.EventId == eventId && r.Status != "Cancelled" && r.Asset.AssetState == "Prepping")
                    .ToListAsync();

                foreach (var reservation in preppingReservations)
                {
                    reservation.Asset.AssetState = "In-Transit Outbound";
                    reservation.Asset.UpdatedAt = DateTime.UtcNow;
                }

                foreach (var queueRecord in queueRecords)
                {
                    queueRecord.PrepStatus = "Dispatched";
                    queueRecord.UpdatedAt = DateTimeOffset.UtcNow;

                    _context.AuditLogs.Add(new AuditLog
                    {
                        AffectedTable = "dispatch_preparation_queue",
                        AffectedRecordId = queueRecord.Id,
                        ActionType = "FORCE_DISPATCH_OVERRIDE",
                        ActorId = currentUserId,
                        NewState = JsonSerializer.SerializeToDocument(new { Status = "Dispatched" }),
                        LoggedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (_supabaseClient != null)
                {
                    try
                    {
                        foreach (var reservation in preppingReservations)
                        {
                            await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                                Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                                "state_update",
                                new { asset_id = reservation.AssetId, new_state = "In-Transit Outbound", timestamp = DateTime.UtcNow }
                            );
                        }
                    }
                    catch
                    {
                        // Realtime broadcast fails only as a warning after DB commit succeeded
                    }
                }
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task UpdateAssetStateAtomicAsync(Guid assetId, string targetState, Guid actorId, Guid? eventId = null)
        {
            // Reuse current transaction if one exists, otherwise start a new one
            using var transaction = _context.Database.CurrentTransaction ?? await _context.Database.BeginTransactionAsync();
            try
            {
                var asset = await _context.Assets.FindAsync(assetId);
                if (asset == null)
                    throw new KeyNotFoundException($"Asset ID {assetId} not found in the registry.");

                string currentState = asset.AssetState;

                // Validate transition strictly against the project's FSD matrix
                if (!IsValidTransition(currentState, targetState))
                {
                    throw new InvalidOperationException($"Invalid state transition from '{currentState}' to '{targetState}'.");
                }

                // Mutate state
                asset.AssetState = targetState;
                asset.UpdatedAt = DateTime.UtcNow;

                // Create audit log
                var auditLog = new AuditLog
                {
                    AffectedTable = "assets",
                    AffectedRecordId = assetId,
                    ActionType = "STATE_MUTATION",
                    ActorId = actorId,
                    NewState = JsonSerializer.SerializeToDocument(new
                    {
                        PreviousState = currentState,
                        NewState = targetState,
                        EventId = eventId
                    }),
                    LoggedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (_supabaseClient != null)
                {
                    try
                    {
                        // Broadcast state update via Supabase Realtime
                        await _supabaseClient.Realtime.Channel("asset-transitions").Send(
                            Supabase.Realtime.Constants.ChannelEventName.Broadcast,
                            "state_update",
                            new { asset_id = assetId, new_state = targetState, timestamp = DateTime.UtcNow }
                        );
                    }
                    catch
                    {
                        // Realtime broadcast fails only as a warning after DB commit succeeded
                    }
                }
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private bool IsValidTransition(string current, string target)
        {
            if (string.Equals(current, target, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(target, "Lost In Action", StringComparison.OrdinalIgnoreCase))
                return true;

            return current.ToLower() switch
            {
                "available" => target.Equals("Committed", StringComparison.OrdinalIgnoreCase),
                "committed" => target.Equals("In-Transit Outbound", StringComparison.OrdinalIgnoreCase) || target.Equals("Prepping", StringComparison.OrdinalIgnoreCase),
                "in-transit outbound" => target.Equals("On-Site", StringComparison.OrdinalIgnoreCase),
                "on-site" => target.Equals("In-Transit Return", StringComparison.OrdinalIgnoreCase),
                "in-transit return" => target.Equals("Pending Count", StringComparison.OrdinalIgnoreCase),
                "pending count" => target.Equals("Available Unprepped", StringComparison.OrdinalIgnoreCase),
                "available unprepped" => target.Equals("Prepping", StringComparison.OrdinalIgnoreCase),
                "prepping" => target.Equals("Available", StringComparison.OrdinalIgnoreCase) || target.Equals("In-Transit Outbound", StringComparison.OrdinalIgnoreCase),
                "lost in action" => true,
                _ => false
            };
        }
    }
}
