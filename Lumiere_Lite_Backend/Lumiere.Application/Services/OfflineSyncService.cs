using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumiere.Application.Services
{
    public class OfflineSyncService : IOfflineSyncService
    {
        private readonly AppDbContext _context;

        public OfflineSyncService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<BatchSyncResultDto> ProcessBatchSyncAsync(FieldReportSyncRequestDto dto, Guid performingUserId)
        {
            var results = new List<SyncItemResultDto>();
            int processedCount = 0;
            int duplicateCount = 0;
            int failedCount = 0;

            foreach (var item in dto.Items)
            {
                // 1. Idempotency Check: Skip duplicate transactions
                var existingItem = await _context.FieldReportQueueItems
                    .FirstOrDefaultAsync(q => q.ClientTxId == item.ClientTxId);

                if (existingItem != null)
                {
                    duplicateCount++;
                    results.Add(new SyncItemResultDto
                    {
                        ClientTxId = item.ClientTxId,
                        Status = "Duplicate",
                        ErrorMessage = existingItem.ErrorMessage,
                        ProcessedAt = existingItem.ProcessedAt ?? DateTime.UtcNow
                    });
                    continue;
                }

                // 2. Register Queue Item
                var queueItem = new FieldReportQueueItem
                {
                    Id = Guid.NewGuid(),
                    ClientTxId = item.ClientTxId,
                    EventType = item.EventType.ToUpperInvariant(),
                    EventId = item.EventId,
                    AssetId = item.AssetId,
                    PayloadJson = string.IsNullOrWhiteSpace(item.PayloadJson) ? "{}" : item.PayloadJson,
                    Status = "Pending",
                    SubmittedAt = item.SubmittedAt == default ? DateTime.UtcNow : item.SubmittedAt,
                    SubmittedBy = performingUserId
                };

                _context.FieldReportQueueItems.Add(queueItem);

                try
                {
                    // 3. Process according to EventType
                    switch (queueItem.EventType)
                    {
                        case "CONFIRM_OUTBOUND":
                            await ProcessOutboundConfirmationAsync(item.AssetId);
                            break;

                        case "CONFIRM_RETURN":
                            await ProcessReturnConfirmationAsync(item.AssetId);
                            break;

                        case "DECLARE_DAMAGE":
                            await ProcessDamageDeclarationAsync(item, performingUserId);
                            break;

                        default:
                            throw new InvalidOperationException($"Unsupported event type '{item.EventType}'.");
                    }

                    queueItem.Status = "Processed";
                    queueItem.ProcessedAt = DateTime.UtcNow;
                    processedCount++;

                    results.Add(new SyncItemResultDto
                    {
                        ClientTxId = item.ClientTxId,
                        Status = "Processed",
                        ProcessedAt = queueItem.ProcessedAt.Value
                    });
                }
                catch (Exception ex)
                {
                    queueItem.Status = "Failed";
                    queueItem.ErrorMessage = ex.Message;
                    queueItem.ProcessedAt = DateTime.UtcNow;
                    failedCount++;

                    results.Add(new SyncItemResultDto
                    {
                        ClientTxId = item.ClientTxId,
                        Status = "Failed",
                        ErrorMessage = ex.Message,
                        ProcessedAt = queueItem.ProcessedAt.Value
                    });
                }

                await _context.SaveChangesAsync();
            }

            return new BatchSyncResultDto
            {
                TotalSubmitted = dto.Items.Count,
                ProcessedCount = processedCount,
                DuplicateCount = duplicateCount,
                FailedCount = failedCount,
                Results = results
            };
        }

        public async Task<IEnumerable<FieldReportSyncItemDto>> GetPendingItemsForUserAsync(Guid userId)
        {
            var items = await _context.FieldReportQueueItems
                .Where(q => q.SubmittedBy == userId && q.Status == "Pending")
                .OrderBy(q => q.SubmittedAt)
                .ToListAsync();

            return items.Select(q => new FieldReportSyncItemDto
            {
                ClientTxId = q.ClientTxId,
                EventType = q.EventType,
                EventId = q.EventId,
                AssetId = q.AssetId,
                PayloadJson = q.PayloadJson,
                SubmittedAt = q.SubmittedAt
            });
        }

        private async Task ProcessOutboundConfirmationAsync(Guid? assetId)
        {
            if (!assetId.HasValue) return;

            var asset = await _context.Assets.FindAsync(assetId.Value);
            if (asset != null)
            {
                asset.AssetState = "In-Transit Outbound";
                asset.UpdatedAt = DateTime.UtcNow;
            }
        }

        private async Task ProcessReturnConfirmationAsync(Guid? assetId)
        {
            if (!assetId.HasValue) return;

            var asset = await _context.Assets.FindAsync(assetId.Value);
            if (asset != null)
            {
                asset.AssetState = "Returned-In-Warehouse";
                asset.UpdatedAt = DateTime.UtcNow;
            }
        }

        private async Task ProcessDamageDeclarationAsync(FieldReportSyncItemDto item, Guid performingUserId)
        {
            if (!item.AssetId.HasValue)
            {
                throw new InvalidOperationException("Asset ID is required for damage declaration.");
            }

            int damagedQty = 1;
            string severity = "Medium";
            string liabilityParty = "Client";
            string photoUrl = string.Empty;

            if (!string.IsNullOrWhiteSpace(item.PayloadJson) && item.PayloadJson != "{}")
            {
                try
                {
                    using var doc = JsonDocument.Parse(item.PayloadJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("damagedQuantity", out var qtyElem) && qtyElem.TryGetInt32(out var q))
                    {
                        damagedQty = Math.Max(1, q);
                    }
                    if (root.TryGetProperty("severity", out var sevElem) && sevElem.ValueKind == JsonValueKind.String)
                    {
                        severity = sevElem.GetString() ?? "Medium";
                    }
                    if (root.TryGetProperty("liabilityParty", out var liabElem) && liabElem.ValueKind == JsonValueKind.String)
                    {
                        liabilityParty = liabElem.GetString() ?? "Client";
                    }
                    if (root.TryGetProperty("photoUrl", out var photoElem) && photoElem.ValueKind == JsonValueKind.String)
                    {
                        photoUrl = photoElem.GetString() ?? string.Empty;
                    }
                }
                catch
                {
                    // Fallback to defaults on parse error
                }
            }

            var damageReport = new DamageReport
            {
                Id = Guid.NewGuid(),
                AssetId = item.AssetId.Value,
                EventId = item.EventId,
                PhotoUrl = photoUrl,
                DamagedQuantity = damagedQty,
                Severity = severity,
                LiabilityParty = liabilityParty,
                ReportStatus = DamageVerdict.PendingVerdict,
                SubmittedBy = performingUserId,
                SubmittedAt = DateTime.UtcNow
            };

            _context.DamageReports.Add(damageReport);

            // Auto-enqueue deficit queue if quantity > 0
            if (damagedQty > 0)
            {
                var deficit = new DeficitQueue
                {
                    Id = Guid.NewGuid(),
                    EventId = item.EventId,
                    AssetId = item.AssetId.Value,
                    QuantityNeeded = damagedQty,
                    DeficitStatus = DeficitStatus.NotPurchased,
                    TriggerSource = "Manual Audit",
                    FlaggedBy = performingUserId,
                    FlaggedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.DeficitQueue.Add(deficit);
            }
        }
    }
}
