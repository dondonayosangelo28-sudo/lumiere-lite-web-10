using System;

namespace Lumiere.Core.Entities
{
    public class EventViewer
    {
        public Guid ViewerId { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string AccessLevel { get; set; } = "VIEW"; // VIEW, COMMENT, CO_EDIT
        public Guid GrantedBy { get; set; }
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
        public Guid? RevokedBy { get; set; }
        public DateTime? RevokedAt { get; set; }

        // Navigation properties
        public Event? Event { get; set; }
        public User? User { get; set; }
        public User? Grantor { get; set; }
        public User? Revoker { get; set; }
    }
}
