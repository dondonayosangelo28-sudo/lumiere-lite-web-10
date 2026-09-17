using System;

namespace Lumiere.Core.Entities
{
    public class DamageReport
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AssetId { get; set; }
        public Guid EventId { get; set; }
        public Guid? BatchId { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public string Sha256Hash { get; set; } = string.Empty;
        public string? ExifMetadata { get; set; } // JSONB stored EXIF metadata
        public bool IsTemporallyValid { get; set; } = true;
        public bool NoPhotographicEvidence { get; set; } = false;
        public int DamagedQuantity { get; set; }
        public string ReportStatus { get; set; } = DamageVerdict.PendingVerdict;
        public string? Severity { get; set; } // Minor | Major | Critical
        public string? LiabilityParty { get; set; } // Warehouse | Carrier | Client | Field Crew | Unknown
        public Guid? LinkedExceptionId { get; set; }
        public DateTime? SettlementDueAt { get; set; }
        public string? SupervisorVerdict { get; set; }
        public Guid? VerdictBy { get; set; }
        public DateTime? VerdictAt { get; set; }
        public decimal? RepairCostEstimate { get; set; }
        public Guid SubmittedBy { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // JSONB columns for exact dual custody & sign-off records
        public string? FirstSignOff { get; set; }
        public string? SecondSignOff { get; set; }
        public string? CustodyMode { get; set; }
        public string? SelfValidationRecord { get; set; }
        public string? EmergencyUnblockMetadata { get; set; }

        public Asset? Asset { get; set; }
        public Event? Event { get; set; }
        public User? VerdictIssuer { get; set; }
        public User? Submitter { get; set; }
    }
}
