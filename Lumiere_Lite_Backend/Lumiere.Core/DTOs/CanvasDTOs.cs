using System;

namespace Lumiere.Core.DTOs
{
    public class SaveCanvasRequest
    {
        public string? CanvasState { get; set; }
        public string? AnnotationState { get; set; }
        public string? PdfUrl { get; set; }
        public string CanvasMode { get; set; } = "Konva";
        public string CanvasStatus { get; set; } = "Draft";
    }

    public class CanvasResponse
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public string? CanvasState { get; set; }
        public string? AnnotationState { get; set; }
        public string? PdfUrl { get; set; }
        public string CanvasMode { get; set; } = string.Empty;
        public string CanvasStatus { get; set; } = string.Empty;
        public Guid? SubmittedBy { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
