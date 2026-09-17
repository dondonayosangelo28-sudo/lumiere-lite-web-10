using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Lumiere.Core.DTOs
{
    public class BulkReservationRequest
    {
        [Required]
        public Guid EventId { get; set; }
        [Required]
        [MinLength(1, ErrorMessage = "At least one asset ID is required.")]
        public List<Guid> AssetIds { get; set; } = new List<Guid>();
        [Required]
        public DateTimeOffset LockStart { get; set; }
        [Required]
        public DateTimeOffset LockEnd { get; set; }
    }

    public class BulkReservationResponse
    {
        public List<Guid> ReservationIds { get; set; } = new List<Guid>();
    }

    public class AssetConflictDetail
    {
        public Guid AssetId { get; set; }
        public Guid ConflictingEventId { get; set; }
        public DateTimeOffset ConflictingLockStart { get; set; }
        public DateTimeOffset ConflictingLockEnd { get; set; }
    }

    public class CanvasValidationRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one asset ID is required.")]
        public List<Guid> AssetIds { get; set; } = new List<Guid>();
        [Required]
        public DateTimeOffset LockStart { get; set; }
        [Required]
        public DateTimeOffset LockEnd { get; set; }
        public Guid? EventId { get; set; }
    }

    public class CanvasValidationResponse
    {
        public List<Guid> AvailableAssetIds { get; set; } = new List<Guid>();
        public List<Guid> ConflictedAssetIds { get; set; } = new List<Guid>();
    }

    public class ReservationResponse
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid AssetId { get; set; }
        public DateTimeOffset LockStart { get; set; }
        public DateTimeOffset LockEnd { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class TemporalConflictException : Exception
    {
        public List<AssetConflictDetail> Conflicts { get; }

        public TemporalConflictException(string message, List<AssetConflictDetail> conflicts) : base(message)
        {
            Conflicts = conflicts;
        }
    }
}
