using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Supabase;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class AssetService : IAssetService
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;
        private readonly Client _supabaseClient;

        public AssetService(AppDbContext context, IAuditLogService auditLogService, Client supabaseClient)
        {
            _context = context;
            _auditLogService = auditLogService;
            _supabaseClient = supabaseClient;
        }

        public async Task<Guid> CreateAssetAsync(CreateAssetRequest request, Guid currentUserId, List<string> userRoles)
        {
            bool hasPermission = request.AssetTier switch
            {
                1 => userRoles.Any(r => r == "WarehouseSupervisor" || r == "Warehouse Operations Manager" || r == "Warehouse Manager" || r == "Inventory Officer" || r == "Admin" || r == "SystemAdmin"),
                2 => userRoles.Any(r => r == "ProductionSupervisor" || r == "Production Manager" || r == "Admin" || r == "SystemAdmin"),
                3 => userRoles.Any(r => r == "ReplenishmentHub" || r == "Inventory Officer" || r == "Admin" || r == "SystemAdmin"),
                4 => userRoles.Any(r => r == "PurchasingOfficer" || r == "Purchasing Officer" || r == "Admin" || r == "SystemAdmin"),
                5 => userRoles.Any(r => r == "ReplenishmentHub" || r == "Inventory Officer" || r == "Admin" || r == "SystemAdmin"),
                _ => false
            };

            if (!hasPermission)
            {
                throw new UnauthorizedAccessException($"You do not have permission to register an asset of Tier {request.AssetTier}.");
            }

            var asset = new Asset
            {
                AssetSubTypeId = request.AssetSubTypeId,
                Name = request.Name,
                Description = request.Description,
                AssetTier = request.AssetTier,
                AssetState = "Available",
                BaseCount = request.Quantity,
                PhotoUrl = request.CatalogPhotoUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "STATE_CHANGE", "assets", asset.Id, null, new { NewState = "Available" });

            return asset.Id;
        }

        public async Task<PaginatedList<AssetResponse>> GetAssetsAsync(int page, int pageSize, int? tier, string? state, Guid? assetTypeId, string? tagValue, string? hexValue)
        {
            var query = _context.Assets
                .Include(a => a.AssetSubType)
                .Include(a => a.Tags)
                .Include(a => a.Colors)
                .AsQueryable();

            if (tier.HasValue) query = query.Where(a => a.AssetTier == tier.Value);
            if (!string.IsNullOrEmpty(state)) query = query.Where(a => a.AssetState == state);
            if (assetTypeId.HasValue) query = query.Where(a => a.AssetSubType != null && a.AssetSubType.AssetTypeId == assetTypeId.Value);
            if (!string.IsNullOrEmpty(tagValue)) query = query.Where(a => a.Tags.Any(t => t.TagValue == tagValue));
            if (!string.IsNullOrEmpty(hexValue)) query = query.Where(a => a.Colors.Any(c => c.HexValue == hexValue));

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AssetResponse
                {
                    Id = a.Id,
                    Name = a.Name,
                    AssetTier = a.AssetTier,
                    AssetState = a.AssetState,
                    Quantity = a.BaseCount
                })
                .ToListAsync();

            return new PaginatedList<AssetResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<AssetDetailResponse> GetAssetByIdAsync(Guid assetId)
        {
            var a = await _context.Assets
                .Include(x => x.Colors)
                .Include(x => x.Tags)
                .FirstOrDefaultAsync(x => x.Id == assetId);

            if (a == null) throw new KeyNotFoundException("Asset not found.");

            return new AssetDetailResponse
            {
                Id = a.Id,
                Name = a.Name,
                AssetTier = a.AssetTier,
                AssetState = a.AssetState,
                Quantity = a.BaseCount,
                Description = a.Description,
                CatalogPhotoUrl = a.PhotoUrl,
                Colors = a.Colors.Select(c => new AssetColorDto
                {
                    HexCode = c.HexValue,
                    PaintBrand = c.PaintBrand,
                    MaterialFinish = c.MaterialFinish
                }).ToList(),
                Tags = a.Tags.Select(t => t.TagValue).ToList()
            };
        }

        public async Task UpdateAssetAsync(Guid assetId, UpdateAssetRequest request, Guid currentUserId)
        {
            var a = await _context.Assets.FindAsync(assetId);
            if (a == null) throw new KeyNotFoundException("Asset not found.");

            var previousState = new { a.Name, a.Description, Quantity = a.BaseCount, CatalogPhotoUrl = a.PhotoUrl };

            if (request.Name != null) a.Name = request.Name;
            if (request.Description != null) a.Description = request.Description;
            if (request.Quantity.HasValue) a.BaseCount = request.Quantity.Value;
            if (request.CatalogPhotoUrl != null) a.PhotoUrl = request.CatalogPhotoUrl;

            a.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "ASSET_UPDATED", "assets", a.Id, previousState, new { a.Name, a.Description, Quantity = a.BaseCount, CatalogPhotoUrl = a.PhotoUrl });
        }

        public async Task AddColorAsync(Guid assetId, AddColorRequest request, Guid currentUserId)
        {
            var a = await _context.Assets.FindAsync(assetId);
            if (a == null) throw new KeyNotFoundException("Asset not found.");

            var color = new AssetColor
            {
                AssetId = assetId,
                HexValue = request.HexCode,
                PaintBrand = request.PaintBrand,
                MaterialFinish = request.MaterialFinish
            };
            _context.AssetColors.Add(color);
            await _context.SaveChangesAsync();
        }

        public async Task AddTagAsync(Guid assetId, AddTagRequest request, Guid currentUserId)
        {
            var a = await _context.Assets.FindAsync(assetId);
            if (a == null) throw new KeyNotFoundException("Asset not found.");

            var tag = new AssetTag
            {
                AssetId = assetId,
                TagValue = request.TagName
            };
            _context.AssetTags.Add(tag);
            await _context.SaveChangesAsync();
        }

        public async Task TransitionStateAsync(Guid assetId, TransitionStateRequest request, Guid currentUserId, bool isSupervisor)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var a = await _context.Assets.FindAsync(assetId);
                if (a == null) throw new KeyNotFoundException("Asset not found.");

                var currentState = a.AssetState;
                var targetState = request.TargetState;

                if (request.OverrideFlag)
                {
                    if (!isSupervisor)
                        throw new UnauthorizedAccessException("Only Supervisors can override state transitions.");

                    a.AssetState = targetState;
                    a.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    await _auditLogService.LogAsync(currentUserId, "SUPERVISOR_OVERRIDE", "assets", a.Id, new { State = currentState }, new { State = targetState });
                }
                else
                {
                    bool isValid = false;
                    string[] validNextStates = Array.Empty<string>();

                    switch (currentState)
                    {
                        case "Available":
                            if (targetState == "Committed")
                            {
                                if (!request.EventId.HasValue) throw new ArgumentException("event_id required to transition to Committed.");
                                isValid = true;
                            }
                            else if (targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "Committed", "Lost In Action" };
                            break;
                        case "Committed":
                            if (targetState == "In-Transit Outbound")
                            {
                                if (!request.EventId.HasValue) throw new ArgumentException("event_id required to transition to In-Transit Outbound.");
                                isValid = true;
                            }
                            else if (targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "In-Transit Outbound", "Lost In Action" };
                            break;
                        case "In-Transit Outbound":
                            if (targetState == "On-Site" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "On-Site", "Lost In Action" };
                            break;
                        case "On-Site":
                            if (targetState == "In-Transit Return" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "In-Transit Return", "Lost In Action" };
                            break;
                        case "In-Transit Return":
                            if (targetState == "Pending Count" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "Pending Count", "Lost In Action" };
                            break;
                        case "Pending Count":
                            if (targetState == "Available Unprepped" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "Available Unprepped", "Lost In Action" };
                            break;
                        case "Available Unprepped":
                            if (targetState == "Prepping" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "Prepping", "Lost In Action" };
                            break;
                        case "Prepping":
                            if (targetState == "Available" || targetState == "In-Transit Outbound" || targetState == "Lost In Action") isValid = true;
                            validNextStates = new[] { "Available", "In-Transit Outbound", "Lost In Action" };
                            break;
                        default:
                            validNextStates = new string[] { };
                            break;
                    }

                    if (!isValid)
                    {
                        throw new InvalidOperationException($"Invalid transition from {currentState} to {targetState}. Valid next states: {string.Join(", ", validNextStates)}");
                    }

                    a.AssetState = targetState;
                    a.UpdatedAt = DateTime.UtcNow;

                    if (targetState == "Lost In Action")
                    {
                        var ticket = new InvestigationTicket
                        {
                            AssetId = a.Id,
                            EventId = request.EventId,
                            ReportId = null,
                            TicketStatus = "Open",
                            OpenedAt = DateTime.UtcNow,
                            AutoExpireAt = DateTime.UtcNow.AddDays(7),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.InvestigationTickets.Add(ticket);
                    }

                    await _context.SaveChangesAsync();
                    await _auditLogService.LogAsync(currentUserId, "STATE_CHANGE", "assets", a.Id, new { State = currentState }, new { State = targetState });
                }

                await transaction.CommitAsync();

                // Broadcast via Supabase Realtime
                try
                {
                    var channel = _supabaseClient.Realtime.Channel("asset-transitions");
                    await channel.Send(Supabase.Realtime.Constants.ChannelEventName.Broadcast, "state-change", new { assetId = a.Id, newState = a.AssetState, timestamp = DateTime.UtcNow });
                }
                catch (Exception)
                {
                    // Fire and forget realtime broadcast
                }
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task SalvageAssetAsync(Guid assetId, SalvageAssetRequest request, Guid currentUserId, bool isSupervisor)
        {
            if (!isSupervisor)
                throw new UnauthorizedAccessException("Only Supervisor or WarehouseSupervisor can perform Salvage Mutation.");

            var a = await _context.Assets.FindAsync(assetId);
            if (a == null) throw new KeyNotFoundException("Asset not found.");

            if (request.NewTier >= a.AssetTier)
                throw new ArgumentException("Salvage mutation requires reclassifying the asset to a lower tier (higher tier number).");

            var prevTier = a.AssetTier;
            a.AssetTier = request.NewTier;
            a.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(currentUserId, "SALVAGE_MUTATION", "assets", a.Id, new { Tier = prevTier }, new { Tier = a.AssetTier, Reason = request.Reason });
        }
    }
}
