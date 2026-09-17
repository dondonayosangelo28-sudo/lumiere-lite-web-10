using Lumiere.Core.DTOs;
using Lumiere.Core.Entities;
using Lumiere.Core.Interfaces;
using Lumiere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Lumiere.Application.Services
{
    public class DamageReportService : IDamageReportService
    {
        private readonly AppDbContext _context;

        public DamageReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> SubmitDamageReportAsync(CreateDamageReportRequest request, Guid currentUserId)
        {
            var asset = await _context.Assets.FindAsync(request.AssetId);
            if (asset == null) throw new KeyNotFoundException("Asset not found.");

            var eventObj = await _context.Events.FindAsync(request.EventId);
            if (eventObj == null) throw new KeyNotFoundException("Event not found.");

            var reportStatus = request.NoPhotographicEvidence 
                ? DamageVerdict.HeldForAudit 
                : DamageVerdict.PendingVerdict;

            var report = new DamageReport
            {
                AssetId = request.AssetId,
                EventId = request.EventId,
                BatchId = request.BatchId,
                PhotoUrl = request.PhotoUrl ?? string.Empty,
                Sha256Hash = request.Sha256Hash ?? string.Empty,
                ExifMetadata = request.ExifMetadata,
                DamagedQuantity = request.DamagedQuantity,
                NoPhotographicEvidence = request.NoPhotographicEvidence,
                Severity = request.Severity,
                LiabilityParty = request.LiabilityParty,
                LinkedExceptionId = request.LinkedExceptionId,
                SettlementDueAt = request.SettlementDueAt,
                ReportStatus = reportStatus,
                SubmittedBy = currentUserId,
                SubmittedAt = DateTime.UtcNow
            };

            _context.DamageReports.Add(report);

            if (request.DamagedQuantity > 0)
            {
                var deficit = new DeficitQueue
                {
                    EventId = request.EventId,
                    AssetId = request.AssetId,
                    AssetDescription = asset?.Description ?? asset?.Name ?? "Damaged Asset",
                    QuantityNeeded = request.DamagedQuantity,
                    DeficitStatus = DeficitStatus.NotPurchased,
                    Priority = request.Severity == "Critical" ? "High" : "Medium",
                    TriggerSource = "Damage Report",
                    FlaggedBy = currentUserId,
                    FlaggedAt = DateTime.UtcNow
                };
                _context.DeficitQueue.Add(deficit);
            }

            await _context.SaveChangesAsync();

            return report.Id;
        }

        public async Task<List<DamageReportResponse>> GetDamageReportsByEventAsync(Guid eventId)
        {
            var reports = await _context.DamageReports
                .Include(r => r.Asset)
                .Include(r => r.Event)
                .Where(r => r.EventId == eventId)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();

            return reports.Select(MapToResponse).ToList();
        }

        public async Task<DamageReportResponse> GetDamageReportByIdAsync(Guid reportId)
        {
            var report = await _context.DamageReports
                .Include(r => r.Asset)
                .Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null) throw new KeyNotFoundException("Damage report not found.");

            return MapToResponse(report);
        }

        public async Task<DamageReportResponse> SignOffDamageReportAsync(
            Guid reportId, 
            DamageSignOffRequest request, 
            Guid currentUserId, 
            string currentUserEmail, 
            string currentUserName, 
            List<string> userRoles)
        {
            // Executive Read-Only Enforcer
            if (IsExecutive(userRoles))
            {
                throw new UnauthorizedAccessException("Executive accounts have read-only/insights access. Sign-off and verdict setting are strictly forbidden.");
            }

            // Require WOM Authority
            if (!IsWomAuthorizer(userRoles))
            {
                throw new UnauthorizedAccessException("Only Warehouse Operations Manager roles or accounts with full warehouse access can issue damage verdicts.");
            }

            var report = await _context.DamageReports.Include(r => r.Asset).FirstOrDefaultAsync(r => r.Id == reportId);
            if (report == null) throw new KeyNotFoundException("Damage report not found.");

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == currentUserId);
            bool allowSelfValidation = user?.Role?.AllowSelfValidation ?? true;
            string womRoleName = user?.Role?.Name ?? "Warehouse Operations Manager";

            var signOffData = new
            {
                staffEmail = currentUserEmail,
                staffName = currentUserName,
                womRole = womRoleName,
                verdict = request.Verdict,
                note = request.Note ?? string.Empty,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string signOffJson = JsonSerializer.Serialize(signOffData);

            if (report.ReportStatus == DamageVerdict.HeldForAudit)
            {
                if (allowSelfValidation)
                {
                    // Single WOM Self-Validation Path
                    if (string.IsNullOrWhiteSpace(request.Pin))
                    {
                        throw new ArgumentException("6-digit confirmation PIN is required for self-validation of Held-for-Audit cases.");
                    }
                    if (string.IsNullOrWhiteSpace(request.Justification) || request.Justification.Trim().Length < 20)
                    {
                        throw new ArgumentException("Mandatory written justification (at least 20 characters) is required for self-validation.");
                    }

                    var selfValData = new
                    {
                        validatedByEmail = currentUserEmail,
                        validatedByName = currentUserName,
                        womRole = womRoleName,
                        pinVerified = true,
                        justification = request.Justification,
                        timestamp = DateTime.UtcNow.ToString("o"),
                        custodyMode = DamageCustodyMode.StandingSelfValidation
                    };

                    report.SelfValidationRecord = JsonSerializer.Serialize(selfValData);
                    report.CustodyMode = DamageCustodyMode.StandingSelfValidation;
                    report.FirstSignOff = signOffJson;
                    report.SupervisorVerdict = request.Verdict;
                    report.VerdictBy = currentUserId;
                    report.VerdictAt = DateTime.UtcNow;
                    report.ReportStatus = request.Verdict;
                    report.RepairCostEstimate = request.RepairCostEstimate;
                }
                else
                {
                    // Dual Sign-Off Path
                    if (string.IsNullOrEmpty(report.FirstSignOff))
                    {
                        // Check if at least 2 distinct WOM accounts exist
                        var womAccountCount = await _context.Users
                            .Where(u => u.IsActive && u.Role != null && (u.Role.Name == "Warehouse Operations Manager" || u.Role.Name == "Warehouse Manager" || u.Role.Name == "Inventory Officer" || u.Role.Name == "Admin" || u.Role.Name == "SystemAdmin"))
                            .CountAsync();

                        if (womAccountCount <= 1 && string.IsNullOrEmpty(report.EmergencyUnblockMetadata))
                        {
                            throw new InvalidOperationException("STRICT BLOCK: Genuine dual-custody requires 2 distinct WOM accounts. Only 1 account exists and self-validation is disabled for this role.");
                        }

                        report.FirstSignOff = signOffJson;
                        report.ReportStatus = DamageVerdict.PendingSecondSignOff;
                    }
                    else
                    {
                        // Second sign-off check
                        using var doc = JsonDocument.Parse(report.FirstSignOff);
                        string firstSignerEmail = doc.RootElement.GetProperty("staffEmail").GetString() ?? string.Empty;

                        if (firstSignerEmail.Equals(currentUserEmail, StringComparison.OrdinalIgnoreCase))
                        {
                            throw new InvalidOperationException("Second sign-off must be performed by a distinct WOM user account.");
                        }

                        report.SecondSignOff = signOffJson;
                        report.CustodyMode = !string.IsNullOrEmpty(report.EmergencyUnblockMetadata) 
                            ? DamageCustodyMode.AdminEnabledOverride 
                            : DamageCustodyMode.GenuineDualCustody;

                        report.SupervisorVerdict = request.Verdict;
                        report.VerdictBy = currentUserId;
                        report.VerdictAt = DateTime.UtcNow;
                        report.ReportStatus = request.Verdict;
                        report.RepairCostEstimate = request.RepairCostEstimate;
                    }
                }
            }
            else
            {
                // Standard Non-Held Sign-Off
                report.FirstSignOff = signOffJson;
                report.SupervisorVerdict = request.Verdict;
                report.VerdictBy = currentUserId;
                report.VerdictAt = DateTime.UtcNow;
                report.ReportStatus = request.Verdict;
                report.RepairCostEstimate = request.RepairCostEstimate;
                if (!string.IsNullOrEmpty(request.LiabilityParty)) report.LiabilityParty = request.LiabilityParty;
                if (request.SettlementDueAt.HasValue) report.SettlementDueAt = request.SettlementDueAt;
                report.CustodyMode ??= DamageCustodyMode.StandingSelfValidation;
            }

            // Execute Asset Side-Effects
            if (report.Asset != null && (report.ReportStatus == DamageVerdict.Repair || report.ReportStatus == DamageVerdict.WriteOff))
            {
                if (report.ReportStatus == DamageVerdict.Repair)
                {
                    report.Asset.AssetState = "In Maintenance";
                    
                    var history = new AssetMaintenanceHistory
                    {
                        AssetId = report.AssetId,
                        EventId = report.EventId,
                        ReportId = report.Id,
                        RepairCost = request.RepairCostEstimate ?? 0,
                        MaintenanceNotes = $"Automated entry from Repair verdict: {request.Note}",
                        RecordedAt = DateTime.UtcNow
                    };
                    _context.AssetMaintenanceHistory.Add(history);
                }
                else if (report.ReportStatus == DamageVerdict.WriteOff)
                {
                    report.Asset.BaseCount -= report.DamagedQuantity;
                    if (report.Asset.BaseCount <= 0)
                    {
                        report.Asset.BaseCount = 0;
                        report.Asset.AssetState = "Depleted";
                    }
                }
            }

            await _context.SaveChangesAsync();
            return MapToResponse(report);
        }

        public async Task<DamageReportResponse> AdminEmergencyUnblockAsync(
            Guid reportId, 
            AdminEmergencyUnblockRequest request, 
            Guid currentUserId, 
            string currentUserEmail)
        {
            var report = await _context.DamageReports.FindAsync(reportId);
            if (report == null) throw new KeyNotFoundException("Damage report not found.");

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new ArgumentException("Reason is required for Admin emergency unblock.");
            }

            var unblockMetadata = new
            {
                originatedFromEmergency = true,
                emergencyReason = request.Reason,
                unblockedByAdminEmail = currentUserEmail,
                unblockScope = request.UnblockScope,
                madePermanentAt = request.UnblockScope == "permanent" ? DateTime.UtcNow.ToString("o") : null,
                permanentAcknowledged = request.PermanentAcknowledged
            };

            report.EmergencyUnblockMetadata = JsonSerializer.Serialize(unblockMetadata);
            report.CustodyMode = DamageCustodyMode.AdminEnabledOverride;

            if (request.UnblockScope == "permanent")
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == currentUserId);
                if (user?.Role != null)
                {
                    user.Role.AllowSelfValidation = true;
                }
            }

            await _context.SaveChangesAsync();
            return MapToResponse(report);
        }

        public async Task CompleteMaintenanceAsync(Guid reportId, Guid currentUserId, List<string> userRoles)
        {
            if (IsExecutive(userRoles))
            {
                throw new UnauthorizedAccessException("Executive accounts are strictly forbidden from completing maintenance.");
            }

            if (!IsWomAuthorizer(userRoles))
            {
                throw new UnauthorizedAccessException("Only Warehouse Operations Manager roles can complete maintenance.");
            }

            var report = await _context.DamageReports.Include(r => r.Asset).FirstOrDefaultAsync(r => r.Id == reportId);
            if (report == null) throw new KeyNotFoundException("Damage report not found.");

            if (report.Asset != null)
            {
                report.Asset.AssetState = "Available";
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsEventSettlementBlockedAsync(Guid eventId)
        {
            var blockingReportsExist = await _context.DamageReports
                .AnyAsync(r => r.EventId == eventId && 
                              (r.ReportStatus == DamageVerdict.PendingVerdict || 
                               r.ReportStatus == DamageVerdict.HeldForAudit || 
                               r.ReportStatus == DamageVerdict.PendingSecondSignOff));

            return blockingReportsExist;
        }

        private static bool IsExecutive(List<string> userRoles)
        {
            return userRoles.Contains("Executive", StringComparer.OrdinalIgnoreCase);
        }

        private static bool IsWomAuthorizer(List<string> userRoles)
        {
            var womRoles = new[] { "Admin", "SystemAdmin", "Warehouse Operations Manager", "Warehouse Manager", "Inventory Officer", "fullWarehouseAccess" };
            return userRoles.Any(r => womRoles.Contains(r, StringComparer.OrdinalIgnoreCase));
        }

        private static DamageReportResponse MapToResponse(DamageReport r)
        {
            return new DamageReportResponse
            {
                Id = r.Id,
                AssetId = r.AssetId,
                AssetName = r.Asset?.Name,
                EventId = r.EventId,
                EventName = r.Event?.Name,
                BatchId = r.BatchId,
                PhotoUrl = r.PhotoUrl,
                Sha256Hash = r.Sha256Hash,
                ExifMetadata = r.ExifMetadata,
                IsTemporallyValid = r.IsTemporallyValid,
                NoPhotographicEvidence = r.NoPhotographicEvidence,
                DamagedQuantity = r.DamagedQuantity,
                ReportStatus = r.ReportStatus,
                Severity = r.Severity,
                LiabilityParty = r.LiabilityParty,
                LinkedExceptionId = r.LinkedExceptionId,
                SettlementDueAt = r.SettlementDueAt,
                SupervisorVerdict = r.SupervisorVerdict,
                VerdictBy = r.VerdictBy,
                VerdictAt = r.VerdictAt,
                RepairCostEstimate = r.RepairCostEstimate,
                SubmittedBy = r.SubmittedBy,
                SubmittedAt = r.SubmittedAt,
                FirstSignOff = r.FirstSignOff,
                SecondSignOff = r.SecondSignOff,
                CustodyMode = r.CustodyMode,
                SelfValidationRecord = r.SelfValidationRecord,
                EmergencyUnblockMetadata = r.EmergencyUnblockMetadata
            };
        }
    }
}
