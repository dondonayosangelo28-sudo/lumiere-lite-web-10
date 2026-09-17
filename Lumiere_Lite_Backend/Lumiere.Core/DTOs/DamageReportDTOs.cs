using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Lumiere.Core.DTOs
{
    public class CreateDamageReportRequest
    {
        [Required]
        [JsonPropertyName("assetId")]
        public Guid AssetId { get; set; }

        [Required]
        [JsonPropertyName("eventId")]
        public Guid EventId { get; set; }

        [JsonPropertyName("boundEvent")]
        public Guid? BoundEvent
        {
            get => EventId;
            set { if (value.HasValue && value.Value != Guid.Empty) EventId = value.Value; }
        }

        [JsonPropertyName("batchId")]
        public Guid? BatchId { get; set; }

        [JsonPropertyName("photoUrl")]
        public string PhotoUrl { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl
        {
            get => PhotoUrl;
            set { if (!string.IsNullOrEmpty(value)) PhotoUrl = value; }
        }

        [JsonPropertyName("sha256Hash")]
        public string Sha256Hash { get; set; } = string.Empty;

        [JsonPropertyName("exifMetadata")]
        public string? ExifMetadata { get; set; }
        
        [Range(1, 10000)]
        [JsonPropertyName("damagedQuantity")]
        public int DamagedQuantity { get; set; } = 1;

        [JsonPropertyName("noPhotographicEvidence")]
        public bool NoPhotographicEvidence { get; set; } = false;

        [JsonPropertyName("severity")]
        public string? Severity { get; set; }

        [JsonPropertyName("liabilityParty")]
        public string? LiabilityParty { get; set; }

        [JsonPropertyName("linkedExceptionId")]
        public Guid? LinkedExceptionId { get; set; }

        [JsonPropertyName("settlementDueAt")]
        public DateTime? SettlementDueAt { get; set; }
    }

    public class DamageSignOffRequest
    {
        [Required]
        [JsonPropertyName("verdict")]
        public string Verdict { get; set; } = string.Empty;

        [JsonPropertyName("note")]
        public string Note { get; set; } = string.Empty;

        [JsonPropertyName("pin")]
        public string? Pin { get; set; }

        [JsonPropertyName("justification")]
        public string? Justification { get; set; }

        [JsonPropertyName("repairCostEstimate")]
        public decimal? RepairCostEstimate { get; set; }

        [JsonPropertyName("liabilityParty")]
        public string? LiabilityParty { get; set; }

        [JsonPropertyName("settlementDueAt")]
        public DateTime? SettlementDueAt { get; set; }
    }

    public class AdminEmergencyUnblockRequest
    {
        [Required]
        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("unblockScope")]
        public string UnblockScope { get; set; } = "instance"; // "instance" or "permanent"

        [JsonPropertyName("permanentAcknowledged")]
        public bool PermanentAcknowledged { get; set; } = false;
    }

    public class DamageReportResponse
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("assetId")]
        public Guid AssetId { get; set; }

        [JsonPropertyName("assetName")]
        public string? AssetName { get; set; }

        [JsonPropertyName("eventId")]
        public Guid EventId { get; set; }

        [JsonPropertyName("eventName")]
        public string? EventName { get; set; }

        [JsonPropertyName("batchId")]
        public Guid? BatchId { get; set; }

        [JsonPropertyName("photoUrl")]
        public string PhotoUrl { get; set; } = string.Empty;

        [JsonPropertyName("sha256Hash")]
        public string Sha256Hash { get; set; } = string.Empty;

        [JsonPropertyName("exifMetadata")]
        public string? ExifMetadata { get; set; }

        [JsonPropertyName("isTemporallyValid")]
        public bool IsTemporallyValid { get; set; }

        [JsonPropertyName("noPhotographicEvidence")]
        public bool NoPhotographicEvidence { get; set; }

        [JsonPropertyName("damagedQuantity")]
        public int DamagedQuantity { get; set; }

        [JsonPropertyName("reportStatus")]
        public string ReportStatus { get; set; } = string.Empty;

        [JsonPropertyName("severity")]
        public string? Severity { get; set; }

        [JsonPropertyName("liabilityParty")]
        public string? LiabilityParty { get; set; }

        [JsonPropertyName("linkedExceptionId")]
        public Guid? LinkedExceptionId { get; set; }

        [JsonPropertyName("settlementDueAt")]
        public DateTime? SettlementDueAt { get; set; }

        [JsonPropertyName("supervisorVerdict")]
        public string? SupervisorVerdict { get; set; }

        [JsonPropertyName("verdictBy")]
        public Guid? VerdictBy { get; set; }

        [JsonPropertyName("verdictAt")]
        public DateTime? VerdictAt { get; set; }

        [JsonPropertyName("repairCostEstimate")]
        public decimal? RepairCostEstimate { get; set; }

        [JsonPropertyName("submittedBy")]
        public Guid SubmittedBy { get; set; }

        [JsonPropertyName("submittedAt")]
        public DateTime SubmittedAt { get; set; }

        [JsonPropertyName("firstSignOff")]
        public string? FirstSignOff { get; set; }

        [JsonPropertyName("secondSignOff")]
        public string? SecondSignOff { get; set; }

        [JsonPropertyName("custodyMode")]
        public string? CustodyMode { get; set; }

        // Mapped explicitly as "selfValidation" to match frontend wire key
        [JsonPropertyName("selfValidation")]
        public string? SelfValidationRecord { get; set; }

        [JsonPropertyName("emergencyUnblockMetadata")]
        public string? EmergencyUnblockMetadata { get; set; }
    }
}
