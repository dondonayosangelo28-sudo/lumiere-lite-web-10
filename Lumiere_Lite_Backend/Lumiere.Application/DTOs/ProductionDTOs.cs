using System;
using System.Collections.Generic;

namespace Lumiere.Application.DTOs
{
    public class ProductionTaskRequestDto
    {
        public Guid EventId { get; set; }
        public string TaskName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TargetQuantity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }

    public class UpdateProgressRequestDto
    {
        public int CompletedQuantity { get; set; }
        public string? Status { get; set; }
    }

    public class ProductionTaskResponseDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string TaskName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TargetQuantity { get; set; }
        public int CompletedQuantity { get; set; }
        public decimal ProgressPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? AssignedUserName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class ProductionQuotaDto
    {
        public Guid Id { get; set; }
        public string Department { get; set; } = string.Empty;
        public int DailyTargetUnits { get; set; }
        public DateTime EffectiveDate { get; set; }
        public string? Notes { get; set; }
    }

    public class GanttScheduleResponseDto
    {
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public DateTime TimelineStart { get; set; }
        public DateTime TimelineEnd { get; set; }
        public List<ProductionTaskResponseDto> Tasks { get; set; } = new();
        public decimal OverallProgressPercentage { get; set; }
    }
}
