using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class CanvasService : ICanvasService
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public CanvasService(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<CanvasResponse?> GetCanvasByEventIdAsync(Guid eventId)
        {
            var canvas = await _context.EventCanvases
                .FirstOrDefaultAsync(c => c.EventId == eventId);

            if (canvas == null) return null;

            return MapToResponse(canvas);
        }

        public async Task<CanvasResponse> SaveCanvasAsync(Guid eventId, SaveCanvasRequest request, Guid currentUserId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId);
            if (!eventExists)
                throw new KeyNotFoundException("Event not found.");

            var canvas = await _context.EventCanvases
                .FirstOrDefaultAsync(c => c.EventId == eventId);

            if (canvas == null)
            {
                canvas = new EventCanvas
                {
                    EventId = eventId,
                    CanvasState = request.CanvasState ?? "{}",
                    AnnotationState = request.AnnotationState ?? "{}",
                    PdfUrl = request.PdfUrl,
                    CanvasMode = request.CanvasMode ?? "Konva",
                    CanvasStatus = request.CanvasStatus ?? "Draft",
                    SubmittedBy = currentUserId,
                    SubmittedAt = DateTime.UtcNow
                };
                _context.EventCanvases.Add(canvas);
            }
            else
            {
                if (request.CanvasState != null) canvas.CanvasState = request.CanvasState;
                if (request.AnnotationState != null) canvas.AnnotationState = request.AnnotationState;
                if (request.PdfUrl != null) canvas.PdfUrl = request.PdfUrl;
                if (request.CanvasMode != null) canvas.CanvasMode = request.CanvasMode;
                if (request.CanvasStatus != null) canvas.CanvasStatus = request.CanvasStatus;

                canvas.SubmittedBy = currentUserId;
                canvas.SubmittedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                currentUserId,
                "CANVAS_SAVED",
                "event_canvases",
                canvas.Id,
                null,
                new { EventId = eventId, canvas.CanvasStatus, canvas.CanvasMode }
            );

            return MapToResponse(canvas);
        }

        public async Task<CanvasResponse> ApproveCanvasAsync(Guid eventId, Guid currentUserId)
        {
            var canvas = await _context.EventCanvases
                .FirstOrDefaultAsync(c => c.EventId == eventId);

            if (canvas == null)
                throw new KeyNotFoundException("Event canvas not found.");

            canvas.CanvasStatus = "Approved";
            canvas.ApprovedBy = currentUserId;
            canvas.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                currentUserId,
                "CANVAS_APPROVED",
                "event_canvases",
                canvas.Id,
                null,
                new { EventId = eventId, Status = "Approved" }
            );

            return MapToResponse(canvas);
        }

        private static CanvasResponse MapToResponse(EventCanvas canvas)
        {
            return new CanvasResponse
            {
                Id = canvas.Id,
                EventId = canvas.EventId,
                CanvasState = canvas.CanvasState,
                AnnotationState = canvas.AnnotationState,
                PdfUrl = canvas.PdfUrl,
                CanvasMode = canvas.CanvasMode,
                CanvasStatus = canvas.CanvasStatus,
                SubmittedBy = canvas.SubmittedBy,
                SubmittedAt = canvas.SubmittedAt,
                ApprovedBy = canvas.ApprovedBy,
                ApprovedAt = canvas.ApprovedAt
            };
        }
    }
}
