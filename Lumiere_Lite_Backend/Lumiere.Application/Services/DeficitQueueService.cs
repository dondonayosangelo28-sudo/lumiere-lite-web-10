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
    public class DeficitQueueService : IDeficitQueueService
    {
        private readonly AppDbContext _context;

        public DeficitQueueService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> FlagDeficitAsync(CreateDeficitRequest request, Guid currentUserId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.Id == request.EventId);
            if (!eventExists) throw new KeyNotFoundException("Event not found.");

            if (request.AssetId.HasValue)
            {
                var assetExists = await _context.Assets.AnyAsync(a => a.Id == request.AssetId.Value);
                if (!assetExists) throw new KeyNotFoundException("Asset not found.");
            }

            var deficit = new DeficitQueue
            {
                EventId = request.EventId,
                AssetId = request.AssetId,
                AssetDescription = request.AssetDescription,
                QuantityNeeded = request.QuantityNeeded,
                DeficitStatus = DeficitStatus.NotPurchased,
                Priority = request.Priority ?? "Medium",
                TriggerSource = request.TriggerSource ?? "Manual Audit",
                PrimaryVendorId = request.PrimaryVendorId,
                BackupVendorId = request.BackupVendorId,
                CostPerUnit = request.CostPerUnit,
                Unit = request.Unit,
                CurrentStock = request.CurrentStock,
                Threshold = request.Threshold,
                Category = request.Category,
                TaggedForDispatch = request.TaggedForDispatch,
                ReorderQty = request.ReorderQty,
                PoRef = request.PoRef,
                EtaHours = request.EtaHours,
                Supplier = request.Supplier,
                FlaggedBy = currentUserId,
                FlaggedAt = DateTime.UtcNow
            };

            _context.DeficitQueue.Add(deficit);
            await _context.SaveChangesAsync();

            return deficit.Id;
        }

        public async Task<List<DeficitResponse>> GetDeficitsAsync(Guid? eventId, string? status)
        {
            var query = _context.DeficitQueue.AsQueryable();

            if (eventId.HasValue) query = query.Where(d => d.EventId == eventId.Value);
            if (!string.IsNullOrEmpty(status)) query = query.Where(d => d.DeficitStatus == status);

            var deficits = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();

            return deficits.Select(d => new DeficitResponse
            {
                Id = d.Id,
                EventId = d.EventId,
                AssetId = d.AssetId,
                AssetDescription = d.AssetDescription,
                QuantityNeeded = d.QuantityNeeded,
                Status = d.DeficitStatus,
                Priority = d.Priority,
                TriggerSource = d.TriggerSource,
                PrimaryVendorId = d.PrimaryVendorId,
                BackupVendorId = d.BackupVendorId,
                CostPerUnit = d.CostPerUnit,
                Unit = d.Unit,
                CurrentStock = d.CurrentStock,
                Threshold = d.Threshold,
                Category = d.Category,
                TaggedForDispatch = d.TaggedForDispatch,
                ReorderQty = d.ReorderQty,
                PoRef = d.PoRef,
                EtaHours = d.EtaHours,
                Supplier = d.Supplier,
                CreatedAt = d.CreatedAt
            }).ToList();
        }

        public async Task UpdateStatusAsync(Guid deficitId, UpdateDeficitStatusRequest request, Guid currentUserId)
        {
            var deficit = await _context.DeficitQueue.FindAsync(deficitId);
            if (deficit == null) throw new KeyNotFoundException("Deficit ticket not found.");

            deficit.DeficitStatus = request.Status;
            
            if (!string.IsNullOrEmpty(request.Priority)) deficit.Priority = request.Priority;
            if (!string.IsNullOrEmpty(request.TriggerSource)) deficit.TriggerSource = request.TriggerSource;
            if (request.PrimaryVendorId.HasValue) deficit.PrimaryVendorId = request.PrimaryVendorId;
            if (request.BackupVendorId.HasValue) deficit.BackupVendorId = request.BackupVendorId;
            if (request.CostPerUnit.HasValue) deficit.CostPerUnit = request.CostPerUnit;
            if (!string.IsNullOrEmpty(request.Unit)) deficit.Unit = request.Unit;
            if (request.CurrentStock.HasValue) deficit.CurrentStock = request.CurrentStock;
            if (request.Threshold.HasValue) deficit.Threshold = request.Threshold;
            if (!string.IsNullOrEmpty(request.Category)) deficit.Category = request.Category;
            if (request.TaggedForDispatch.HasValue) deficit.TaggedForDispatch = request.TaggedForDispatch;

            if (request.ReorderQty.HasValue) deficit.ReorderQty = request.ReorderQty;
            if (!string.IsNullOrEmpty(request.PoRef)) deficit.PoRef = request.PoRef;
            if (request.EtaHours.HasValue) deficit.EtaHours = request.EtaHours;
            if (!string.IsNullOrEmpty(request.Supplier)) deficit.Supplier = request.Supplier;

            if (request.Status == DeficitStatus.Received || request.Status == "Resolved")
            {
                deficit.ResolvedBy = currentUserId;
                deficit.ResolvedAt = DateTime.UtcNow;
            }
            deficit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }
}
