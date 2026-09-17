using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Lumiere.Application.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumiere.Application.Services
{
    public class ProductionService : IProductionService
    {
        private readonly AppDbContext _context;

        public ProductionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GanttScheduleResponseDto> GetGanttScheduleForEventAsync(Guid eventId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null)
            {
                throw new KeyNotFoundException($"Event with ID '{eventId}' was not found.");
            }

            var tasks = await _context.ProductionTasks
                .Include(t => t.Event)
                .Include(t => t.AssignedUser)
                .Where(t => t.EventId == eventId)
                .OrderBy(t => t.StartDate)
                .ThenBy(t => t.TaskName)
                .ToListAsync();

            var taskDtos = tasks.Select(MapToResponseDto).ToList();

            var timelineStart = tasks.Any() ? tasks.Min(t => t.StartDate) : ev.DateOfEvent;
            var timelineEnd = tasks.Any() ? tasks.Max(t => t.EndDate) : ev.DateOfEvent.AddDays(7);

            var totalTarget = tasks.Sum(t => t.TargetQuantity);
            var totalCompleted = tasks.Sum(t => t.CompletedQuantity);
            var overallProgress = totalTarget > 0 
                ? Math.Min(100m, Math.Round((decimal)totalCompleted / totalTarget * 100m, 2)) 
                : 0m;

            return new GanttScheduleResponseDto
            {
                EventId = ev.Id,
                EventName = ev.Name,
                TimelineStart = timelineStart,
                TimelineEnd = timelineEnd,
                Tasks = taskDtos,
                OverallProgressPercentage = overallProgress
            };
        }

        public async Task<ProductionTaskResponseDto> CreateTaskAsync(ProductionTaskRequestDto dto)
        {
            var ev = await _context.Events.FindAsync(dto.EventId);
            if (ev == null)
            {
                throw new KeyNotFoundException($"Event with ID '{dto.EventId}' was not found.");
            }

            User? assignedUser = null;
            if (dto.AssignedToUserId.HasValue)
            {
                assignedUser = await _context.Users.FindAsync(dto.AssignedToUserId.Value);
            }

            var task = new ProductionTask
            {
                Id = Guid.NewGuid(),
                EventId = dto.EventId,
                TaskName = dto.TaskName,
                Category = dto.Category,
                TargetQuantity = dto.TargetQuantity,
                CompletedQuantity = 0,
                ProgressPercentage = 0m,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                AssignedToUserId = dto.AssignedToUserId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProductionTasks.Add(task);
            await _context.SaveChangesAsync();

            task.Event = ev;
            task.AssignedUser = assignedUser;

            return MapToResponseDto(task);
        }

        public async Task<ProductionTaskResponseDto> UpdateProgressAsync(Guid taskId, UpdateProgressRequestDto dto)
        {
            var task = await _context.ProductionTasks
                .Include(t => t.Event)
                .Include(t => t.AssignedUser)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new KeyNotFoundException($"Production task with ID '{taskId}' was not found.");
            }

            task.CompletedQuantity = Math.Max(0, dto.CompletedQuantity);
            task.ProgressPercentage = task.TargetQuantity > 0 
                ? Math.Min(100m, Math.Round((decimal)task.CompletedQuantity / task.TargetQuantity * 100m, 2)) 
                : 0m;

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                task.Status = dto.Status;
            }
            else if (task.CompletedQuantity >= task.TargetQuantity)
            {
                task.Status = "Completed";
            }
            else if (task.CompletedQuantity > 0)
            {
                task.Status = "In-Progress";
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToResponseDto(task);
        }

        public async Task<ProductionQuotaDto> SetQuotaAsync(ProductionQuotaDto dto)
        {
            var existingQuota = await _context.ProductionQuotas
                .FirstOrDefaultAsync(q => q.Department.ToLower() == dto.Department.ToLower());

            if (existingQuota != null)
            {
                existingQuota.DailyTargetUnits = dto.DailyTargetUnits;
                existingQuota.EffectiveDate = dto.EffectiveDate;
                existingQuota.Notes = dto.Notes;
                existingQuota.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existingQuota = new ProductionQuota
                {
                    Id = Guid.NewGuid(),
                    Department = dto.Department,
                    DailyTargetUnits = dto.DailyTargetUnits,
                    EffectiveDate = dto.EffectiveDate,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ProductionQuotas.Add(existingQuota);
            }

            await _context.SaveChangesAsync();

            return new ProductionQuotaDto
            {
                Id = existingQuota.Id,
                Department = existingQuota.Department,
                DailyTargetUnits = existingQuota.DailyTargetUnits,
                EffectiveDate = existingQuota.EffectiveDate,
                Notes = existingQuota.Notes
            };
        }

        public async Task<IEnumerable<ProductionQuotaDto>> GetQuotasAsync()
        {
            var quotas = await _context.ProductionQuotas
                .OrderBy(q => q.Department)
                .ToListAsync();

            return quotas.Select(q => new ProductionQuotaDto
            {
                Id = q.Id,
                Department = q.Department,
                DailyTargetUnits = q.DailyTargetUnits,
                EffectiveDate = q.EffectiveDate,
                Notes = q.Notes
            });
        }

        private static ProductionTaskResponseDto MapToResponseDto(ProductionTask entity)
        {
            return new ProductionTaskResponseDto
            {
                Id = entity.Id,
                EventId = entity.EventId,
                EventName = entity.Event?.Name ?? string.Empty,
                TaskName = entity.TaskName,
                Category = entity.Category,
                TargetQuantity = entity.TargetQuantity,
                CompletedQuantity = entity.CompletedQuantity,
                ProgressPercentage = entity.ProgressPercentage,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                AssignedToUserId = entity.AssignedToUserId,
                AssignedUserName = entity.AssignedUser?.FullName,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
