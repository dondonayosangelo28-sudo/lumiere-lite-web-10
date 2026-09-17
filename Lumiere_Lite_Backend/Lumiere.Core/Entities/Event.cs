using System;

namespace Lumiere.Core.Entities
{
    public class Event
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public DateTime DateOfEvent { get; set; }
        public DateTime IngressDate { get; set; }
        public TimeSpan IngressTime { get; set; }
        public TimeSpan FullStop { get; set; }
        public string EventVenue { get; set; } = string.Empty;
        public string GeoClass { get; set; } = string.Empty; // Local or National
        public DateTime MobilizationDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public int TransitBufferDays { get; set; } = 1;
        public string? EventPegs { get; set; }
        public string? ColorPalette { get; set; }
        public string? BrandingAndTextures { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedRevenue { get; set; }
        public bool IsLossMaker { get; set; } = false;
        public string Status { get; set; } = "Active";

        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
