using CsvHelper;
using CsvHelper.Configuration;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class AssetCsvRecord
    {
        public Guid AssetSubTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AssetTier { get; set; }
        public int Quantity { get; set; }
    }

    public class AssetImportService : IAssetImportService
    {
        private readonly AppDbContext _context;
        private readonly IBackgroundRemovalService _backgroundRemovalService;
        private readonly ILogger<AssetImportService> _logger;
        private readonly Supabase.Client _supabaseClient;

        public AssetImportService(AppDbContext context, IBackgroundRemovalService backgroundRemovalService, ILogger<AssetImportService> logger, Supabase.Client supabaseClient)
        {
            _context = context;
            _backgroundRemovalService = backgroundRemovalService;
            _logger = logger;
            _supabaseClient = supabaseClient;
        }

        public async Task<List<Guid>> ImportAssetsPhase1Async(Stream csvStream, Guid currentUserId)
        {
            if (csvStream == null || csvStream.Length == 0)
                throw new ArgumentException("CSV stream is required.");

            using var reader = new StreamReader(csvStream);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true });

            var records = csv.GetRecords<AssetCsvRecord>().ToList();

            if (records.Count > 75)
            {
                throw new InvalidOperationException("Bulk import is capped at 75 items per transaction.");
            }

            var createdIds = new List<Guid>();

            foreach (var record in records)
            {
                var asset = new Asset
                {
                    AssetSubTypeId = record.AssetSubTypeId,
                    Name = record.Name,
                    Description = record.Description,
                    AssetTier = record.AssetTier,
                    BaseCount = record.Quantity > 0 ? record.Quantity : 1,
                    AssetState = "Available",
                    PhotoUrl = "Photo Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Assets.Add(asset);
                createdIds.Add(asset.Id);
            }

            await _context.SaveChangesAsync();

            return createdIds;
        }

        public async Task ImportAssetsPhase2Async(List<Stream> imageStreams, List<Guid> assetIds, Guid currentUserId)
        {
            if (imageStreams.Count != assetIds.Count)
                throw new ArgumentException("Number of images must match number of asset IDs provided.");

            for (int i = 0; i < imageStreams.Count; i++)
            {
                var imageStream = imageStreams[i];
                var assetId = assetIds[i];

                var asset = await _context.Assets.FindAsync(assetId);
                if (asset == null)
                {
                    _logger.LogWarning($"Asset ID {assetId} not found, skipping image upload.");
                    continue;
                }

                try
                {
                    var processedStream = await _backgroundRemovalService.RemoveBackgroundAsync(imageStream);

                    if (processedStream.CanSeek)
                        processedStream.Position = 0;

                    using var memoryStream = new MemoryStream();
                    await processedStream.CopyToAsync(memoryStream);
                    var bytes = memoryStream.ToArray();

                    var fileName = $"{assetId}_{DateTime.UtcNow.Ticks}.png";
                    var storagePath = $"asset-photos/{fileName}";

                    var response = await _supabaseClient.Storage.From("assets").Upload(bytes, storagePath);

                    var publicUrl = _supabaseClient.Storage.From("assets").GetPublicUrl(storagePath);

                    asset.PhotoUrl = publicUrl;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Background removal or upload failed for asset {assetId}. Using original if possible or keeping Photo Pending.");
                }

                asset.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
