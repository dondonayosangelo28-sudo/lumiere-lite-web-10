using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Lumiere.Core.DTOs
{
    public class CreateEventRequest
    {
        [Required]
        public string EventName { get; set; } = string.Empty;
        [Required]
        public DateTime DateOfEvent { get; set; }
        [Required]
        public DateTime IngressDate { get; set; }
        [Required]
        public TimeSpan IngressTime { get; set; }
        [Required]
        public TimeSpan FullStop { get; set; }
        [Required]
        public string EventVenue { get; set; } = string.Empty;
        [Required]
        [RegularExpression("^(Local|National)$", ErrorMessage = "GeoClass must be Local or National")]
        public string GeoClass { get; set; } = string.Empty;
        
        public DateTime ReturnDate { get; set; }
        public string? EventPegs { get; set; }
        public string? ColorPalette { get; set; }
        public string? BrandingAndTextures { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedRevenue { get; set; }
    }

    public class UpdateEventRequest
    {
        public string? EventName { get; set; }
        public string? EventVenue { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        // expand as needed based on requirements
    }

    public class EventResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateOfEvent { get; set; }
        public DateTime IngressDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string GeoClass { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsLossMaker { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PaginatedList<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class GrantCanvasAccessRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(VIEW|COMMENT|CO_EDIT)$", ErrorMessage = "AccessLevel must be VIEW, COMMENT, or CO_EDIT")]
        public string AccessLevel { get; set; } = "VIEW";
    }

    public class ModifyCanvasAccessRequest
    {
        [Required]
        [RegularExpression("^(VIEW|COMMENT|CO_EDIT)$", ErrorMessage = "AccessLevel must be VIEW, COMMENT, or CO_EDIT")]
        public string AccessLevel { get; set; } = "VIEW";
    }

    public class EventViewerResponse
    {
        public Guid ViewerId { get; set; }
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string AccessLevel { get; set; } = string.Empty;
        public Guid GrantedBy { get; set; }
        public DateTime GrantedAt { get; set; }
    }
}
