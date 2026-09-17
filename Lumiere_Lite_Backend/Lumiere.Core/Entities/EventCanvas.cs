using System;

namespace Lumiere.Core.Entities
{
    public class EventCanvas
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public string? CanvasState { get; set; } // JSONB serialized canvas state
        public string? AnnotationState { get; set; } // JSONB serialized annotation state
        public string? PdfUrl { get; set; }
        public string CanvasMode { get; set; } = "PDF";
        public string CanvasStatus { get; set; } = "Draft";
        public Guid? SubmittedBy { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public Event? Event { get; set; }
        public User? Submitter { get; set; }
        public User? Approver { get; set; }
    }
}
