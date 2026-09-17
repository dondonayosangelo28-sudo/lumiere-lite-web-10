using System;
using System.Collections.Generic;

namespace Lumiere.Application.DTOs
{
    public class FieldReportSyncItemDto
    {
        public string ClientTxId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty; // CONFIRM_OUTBOUND, CONFIRM_RETURN, DECLARE_DAMAGE
        public Guid EventId { get; set; }
        public Guid? AssetId { get; set; }
        public string PayloadJson { get; set; } = "{}";
        public DateTime SubmittedAt { get; set; }
    }

    public class FieldReportSyncRequestDto
    {
        public List<FieldReportSyncItemDto> Items { get; set; } = new();
    }

    public class SyncItemResultDto
    {
        public string ClientTxId { get; set; } = string.Empty;
        public string Status { get; set; } = "Processed"; // Processed, Duplicate, Failed
        public string? ErrorMessage { get; set; }
        public DateTime ProcessedAt { get; set; }
    }

    public class BatchSyncResultDto
    {
        public int TotalSubmitted { get; set; }
        public int ProcessedCount { get; set; }
        public int DuplicateCount { get; set; }
        public int FailedCount { get; set; }
        public List<SyncItemResultDto> Results { get; set; } = new();
    }
}
