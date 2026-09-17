using Lumiere.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Lumiere.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<EphemeralPermission> EphemeralPermissions { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<BlacklistedToken> BlacklistedTokens { get; set; } = null!;
        public DbSet<Event> Events { get; set; } = null!;
        public DbSet<EventFinancials> EventFinancials { get; set; } = null!;
        public DbSet<AssetType> AssetTypes { get; set; } = null!;
        public DbSet<AssetSubType> AssetSubTypes { get; set; } = null!;
        public DbSet<Asset> Assets { get; set; } = null!;
        public DbSet<AssetColor> AssetColors { get; set; } = null!;
        public DbSet<AssetTag> AssetTags { get; set; } = null!;
        public DbSet<AssetVendor> AssetVendors { get; set; } = null!;
        public DbSet<InvestigationTicket> InvestigationTickets { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<VendorRepresentative> VendorRepresentatives { get; set; } = null!;
        public DbSet<VendorContactNumber> VendorContactNumbers { get; set; } = null!;
        public DbSet<VendorContactPlatform> VendorContactPlatforms { get; set; } = null!;
        public DbSet<DeficitQueue> DeficitQueue { get; set; } = null!;
        public DbSet<AssetReservation> AssetReservations { get; set; } = null!;
        public DbSet<DispatchPreparationQueue> DispatchPreparationQueue { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<EventCanvas> EventCanvases { get; set; } = null!;
        public DbSet<DamageReport> DamageReports { get; set; } = null!;
        public DbSet<AssetMaintenanceHistory> AssetMaintenanceHistory { get; set; } = null!;
        public DbSet<EventViewer> EventViewers { get; set; } = null!;
        public DbSet<ManningAssignment> ManningAssignments { get; set; } = null!;
        public DbSet<ProductionTask> ProductionTasks { get; set; } = null!;
        public DbSet<ProductionQuota> ProductionQuotas { get; set; } = null!;
        public DbSet<FieldReportQueueItem> FieldReportQueueItems { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. User
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.Property(e => e.Id).HasColumnName("user_id");
                entity.Property(e => e.Email).HasColumnName("email");
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
                entity.Property(e => e.FullName).HasColumnName("full_name");
                entity.Property(e => e.RoleId).HasColumnName("role_id");
                entity.Property(e => e.ContactNumber).HasColumnName("contact_number");
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Role).WithMany(r => r.Users).HasForeignKey(e => e.RoleId);
            });

            // 2. Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");
                entity.Property(e => e.Id).HasColumnName("role_id");
                entity.Property(e => e.Name).HasColumnName("role_name");
                entity.Property(e => e.Description).HasColumnName("role_description");
                entity.Property(e => e.AllowSelfValidation).HasColumnName("allow_self_validation");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // 3. Ephemeral Permission
            modelBuilder.Entity<EphemeralPermission>(entity =>
            {
                entity.ToTable("ephemeral_permissions");
                entity.Property(e => e.Id).HasColumnName("perm_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.TempRoleId).HasColumnName("temp_role_id");
                entity.Property(e => e.StartTimestamp).HasColumnName("start_timestamp");
                entity.Property(e => e.EndTimestamp).HasColumnName("end_timestamp");
                entity.Property(e => e.AuthReason).HasColumnName("auth_reason");
                entity.Property(e => e.GrantedBy).HasColumnName("granted_by");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
                entity.HasOne(e => e.TempRole).WithMany().HasForeignKey(e => e.TempRoleId);
                entity.HasOne(e => e.Grantor).WithMany().HasForeignKey(e => e.GrantedBy);
            });

            // 4. Event
            modelBuilder.Entity<Event>(entity =>
            {
                entity.ToTable("events");
                entity.Property(e => e.Id).HasColumnName("event_id");
                entity.Property(e => e.Name).HasColumnName("event_name");
                entity.Property(e => e.DateOfEvent).HasColumnName("date_of_event");
                entity.Property(e => e.IngressDate).HasColumnName("ingress_date");
                entity.Property(e => e.IngressTime).HasColumnName("ingress_time");
                entity.Property(e => e.FullStop).HasColumnName("full_stop");
                entity.Property(e => e.EventVenue).HasColumnName("event_venue");
                entity.Property(e => e.GeoClass).HasColumnName("geo_class");
                entity.Property(e => e.MobilizationDate).HasColumnName("mobilization_date");
                entity.Property(e => e.ReturnDate).HasColumnName("return_date");
                entity.Property(e => e.TransitBufferDays).HasColumnName("transit_buffer_days");
                entity.Property(e => e.EventPegs).HasColumnName("event_pegs");
                entity.Property(e => e.ColorPalette).HasColumnName("color_palette");
                entity.Property(e => e.BrandingAndTextures).HasColumnName("branding_and_textures");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.EstimatedRevenue).HasColumnName("estimated_revenue");
                entity.Property(e => e.IsLossMaker).HasColumnName("is_loss_maker");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.CreatedBy).HasColumnName("created_by");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // 5. Asset Type
            modelBuilder.Entity<AssetType>(entity =>
            {
                entity.ToTable("asset_types");
                entity.Property(e => e.Id).HasColumnName("asset_type_id");
                entity.Property(e => e.Name).HasColumnName("asset_type_name");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // 6. Asset Sub Type
            modelBuilder.Entity<AssetSubType>(entity =>
            {
                entity.ToTable("asset_sub_types");
                entity.Property(e => e.Id).HasColumnName("asset_sub_type_id");
                entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
                entity.Property(e => e.Name).HasColumnName("asset_sub_type_name");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.AssetType).WithMany(t => t.SubTypes).HasForeignKey(e => e.AssetTypeId);
            });

            // 7. Asset
            modelBuilder.Entity<Asset>(entity =>
            {
                entity.ToTable("assets");
                entity.Property(e => e.Id).HasColumnName("asset_id");
                entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
                entity.Property(e => e.AssetSubTypeId).HasColumnName("asset_sub_type_id");
                entity.Property(e => e.AssetTier).HasColumnName("asset_tier");
                entity.Property(e => e.AssetState).HasColumnName("asset_state");
                entity.Property(e => e.Name).HasColumnName("asset_name");
                entity.Property(e => e.ItemCallName).HasColumnName("item_call_name");
                entity.Property(e => e.Description).HasColumnName("item_description");
                entity.Property(e => e.BaseCount).HasColumnName("base_count");
                entity.Property(e => e.Unit).HasColumnName("unit");
                entity.Property(e => e.Cost).HasColumnName("cost");
                entity.Property(e => e.Shape).HasColumnName("shape");
                entity.Property(e => e.Height).HasColumnName("height");
                entity.Property(e => e.Width).HasColumnName("width");
                entity.Property(e => e.Weight).HasColumnName("weight");
                entity.Property(e => e.IsCircular).HasColumnName("is_circular");
                entity.Property(e => e.Circumference).HasColumnName("circumference");
                entity.Property(e => e.IsMonoColor).HasColumnName("is_mono_color");
                entity.Property(e => e.IsMultiColor).HasColumnName("is_multi_color");
                entity.Property(e => e.IsChangeableColor).HasColumnName("is_changeable_color");
                entity.Property(e => e.Origin).HasColumnName("origin");
                entity.Property(e => e.Material).HasColumnName("material");
                entity.Property(e => e.IsFragile).HasColumnName("is_fragile");
                entity.Property(e => e.KittingData).HasColumnName("kitting_data").HasColumnType("jsonb");
                entity.Property(e => e.PhotoUrl).HasColumnName("photo_url");
                entity.Property(e => e.OriginalValue).HasColumnName("original_value");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.AssetType).WithMany().HasForeignKey(e => e.AssetTypeId);
                entity.HasOne(e => e.AssetSubType).WithMany(s => s.Assets).HasForeignKey(e => e.AssetSubTypeId);
            });

            // 8. Asset Color
            modelBuilder.Entity<AssetColor>(entity =>
            {
                entity.ToTable("asset_colors");
                entity.Property(e => e.Id).HasColumnName("color_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.HexValue).HasColumnName("hex_value");
                entity.Property(e => e.PaintBrand).HasColumnName("paint_brand");
                entity.Property(e => e.MaterialFinish).HasColumnName("material_finish");
                entity.Property(e => e.ColorOrder).HasColumnName("color_order");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany(a => a.Colors).HasForeignKey(e => e.AssetId);
            });

            // 9. Asset Tag
            modelBuilder.Entity<AssetTag>(entity =>
            {
                entity.ToTable("asset_tags");
                entity.Property(e => e.Id).HasColumnName("tag_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.TagValue).HasColumnName("tag_value");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany(a => a.Tags).HasForeignKey(e => e.AssetId);
            });

            // 10. Vendor
            modelBuilder.Entity<Vendor>(entity =>
            {
                entity.ToTable("vendors");
                entity.Property(e => e.Id).HasColumnName("vendor_id");
                entity.Property(e => e.VendorName).HasColumnName("vendor_name");
                entity.Property(e => e.Address).HasColumnName("address");
                entity.Property(e => e.VendorNotes).HasColumnName("vendor_notes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // 11. Vendor Representative
            modelBuilder.Entity<VendorRepresentative>(entity =>
            {
                entity.ToTable("vendor_representatives");
                entity.Property(e => e.Id).HasColumnName("representative_id");
                entity.Property(e => e.VendorId).HasColumnName("vendor_id");
                entity.Property(e => e.RepresentativeName).HasColumnName("representative_name");
                entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Vendor).WithMany(v => v.Representatives).HasForeignKey(e => e.VendorId);
            });

            // 12. Vendor Contact Number
            modelBuilder.Entity<VendorContactNumber>(entity =>
            {
                entity.ToTable("vendor_contact_numbers");
                entity.Property(e => e.Id).HasColumnName("contact_number_id");
                entity.Property(e => e.RepresentativeId).HasColumnName("representative_id");
                entity.Property(e => e.ContactNumber).HasColumnName("contact_number");
                entity.Property(e => e.NumberLabel).HasColumnName("number_label");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Representative).WithMany(r => r.ContactNumbers).HasForeignKey(e => e.RepresentativeId);
            });

            // 13. Vendor Contact Platform
            modelBuilder.Entity<VendorContactPlatform>(entity =>
            {
                entity.ToTable("vendor_contact_platforms");
                entity.Property(e => e.Id).HasColumnName("platform_id");
                entity.Property(e => e.RepresentativeId).HasColumnName("representative_id");
                entity.Property(e => e.PlatformType).HasColumnName("platform_type");
                entity.Property(e => e.PlatformValue).HasColumnName("platform_value");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Representative).WithMany(r => r.Platforms).HasForeignKey(e => e.RepresentativeId);
            });

            // 14. Asset Vendor (Composite PK)
            modelBuilder.Entity<AssetVendor>(entity =>
            {
                entity.ToTable("asset_vendors");
                entity.HasKey(e => new { e.AssetId, e.VendorId });
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.VendorId).HasColumnName("vendor_id");
                entity.Property(e => e.RentalPeriodStart).HasColumnName("rental_period_start");
                entity.Property(e => e.RentalPeriodEnd).HasColumnName("rental_period_end");
                entity.Property(e => e.RentalCost).HasColumnName("rental_cost");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany(a => a.Vendors).HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Vendor).WithMany().HasForeignKey(e => e.VendorId);
            });

            // 15. Asset Reservation
            modelBuilder.Entity<AssetReservation>(entity =>
            {
                entity.ToTable("asset_reservations");
                entity.Property(e => e.Id).HasColumnName("res_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.LockStart).HasColumnName("lock_start");
                entity.Property(e => e.LockEnd).HasColumnName("lock_end");
                entity.Property(e => e.IsProvisional).HasColumnName("is_provisional");
                entity.Property(e => e.ReservedBy).HasColumnName("reserved_by");
                entity.Property(e => e.ReservedAt).HasColumnName("reserved_at");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.Reserver).WithMany().HasForeignKey(e => e.ReservedBy);
            });

            // 16. Event Canvas
            modelBuilder.Entity<EventCanvas>(entity =>
            {
                entity.ToTable("event_canvases");
                entity.Property(e => e.Id).HasColumnName("canvas_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.CanvasState).HasColumnName("canvas_state").HasColumnType("jsonb");
                entity.Property(e => e.AnnotationState).HasColumnName("annotation_state").HasColumnType("jsonb");
                entity.Property(e => e.PdfUrl).HasColumnName("pdf_url");
                entity.Property(e => e.CanvasMode).HasColumnName("canvas_mode");
                entity.Property(e => e.CanvasStatus).HasColumnName("canvas_status");
                entity.Property(e => e.SubmittedBy).HasColumnName("submitted_by");
                entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
                entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
                entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");

                entity.HasIndex(e => e.EventId).IsUnique();
                entity.HasOne(e => e.Event).WithOne().HasForeignKey<EventCanvas>(e => e.EventId);
                entity.HasOne(e => e.Submitter).WithMany().HasForeignKey(e => e.SubmittedBy);
                entity.HasOne(e => e.Approver).WithMany().HasForeignKey(e => e.ApprovedBy);
            });

            // 17. Deficit Queue
            modelBuilder.Entity<DeficitQueue>(entity =>
            {
                entity.ToTable("deficit_queue");
                entity.Property(e => e.Id).HasColumnName("deficit_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.AssetDescription).HasColumnName("asset_description");
                entity.Property(e => e.QuantityNeeded).HasColumnName("quantity_needed");
                entity.Property(e => e.DeficitStatus).HasColumnName("deficit_status");
                entity.Property(e => e.ReorderQty).HasColumnName("reorder_qty");
                entity.Property(e => e.PoRef).HasColumnName("po_ref");
                entity.Property(e => e.EtaHours).HasColumnName("eta_hours");
                entity.Property(e => e.Supplier).HasColumnName("supplier");
                entity.Property(e => e.Priority).HasColumnName("priority");
                entity.Property(e => e.TriggerSource).HasColumnName("trigger_source");
                entity.Property(e => e.PrimaryVendorId).HasColumnName("primary_vendor_id");
                entity.Property(e => e.BackupVendorId).HasColumnName("backup_vendor_id");
                entity.Property(e => e.CostPerUnit).HasColumnName("cost_per_unit");
                entity.Property(e => e.Unit).HasColumnName("unit");
                entity.Property(e => e.CurrentStock).HasColumnName("current_stock");
                entity.Property(e => e.Threshold).HasColumnName("threshold");
                entity.Property(e => e.Category).HasColumnName("category");
                entity.Property(e => e.TaggedForDispatch).HasColumnName("tagged_for_dispatch");
                entity.Property(e => e.FlaggedBy).HasColumnName("flagged_by");
                entity.Property(e => e.FlaggedAt).HasColumnName("flagged_at");
                entity.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
                entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Flagger).WithMany().HasForeignKey(e => e.FlaggedBy);
                entity.HasOne(e => e.Resolver).WithMany().HasForeignKey(e => e.ResolvedBy);
                entity.HasOne(e => e.PrimaryVendor).WithMany().HasForeignKey(e => e.PrimaryVendorId);
                entity.HasOne(e => e.BackupVendor).WithMany().HasForeignKey(e => e.BackupVendorId);
            });

            // 18. Dispatch Preparation Queue
            modelBuilder.Entity<DispatchPreparationQueue>(entity =>
            {
                entity.ToTable("dispatch_preparation_queue");
                entity.Property(e => e.Id).HasColumnName("prep_queue_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.CanvasId).HasColumnName("canvas_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.QuantityRequired).HasColumnName("quantity_required");
                entity.Property(e => e.PrepStatus).HasColumnName("prep_status");
                entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
                entity.Property(e => e.PrepNotes).HasColumnName("prep_notes");
                entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.Canvas).WithMany().HasForeignKey(e => e.CanvasId);
                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.AssignedStaff).WithMany().HasForeignKey(e => e.AssignedTo);
                entity.HasOne(e => e.LastUpdater).WithMany().HasForeignKey(e => e.UpdatedBy);
            });

            // 19. Damage Report
            modelBuilder.Entity<DamageReport>(entity =>
            {
                entity.ToTable("damage_reports");
                entity.Property(e => e.Id).HasColumnName("report_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.BatchId).HasColumnName("batch_id");
                entity.Property(e => e.PhotoUrl).HasColumnName("photo_url");
                entity.Property(e => e.Sha256Hash).HasColumnName("sha256_hash");
                entity.Property(e => e.ExifMetadata).HasColumnName("exif_metadata").HasColumnType("jsonb");
                entity.Property(e => e.IsTemporallyValid).HasColumnName("is_temporally_valid");
                entity.Property(e => e.NoPhotographicEvidence).HasColumnName("no_photographic_evidence");
                entity.Property(e => e.DamagedQuantity).HasColumnName("damaged_quantity");
                entity.Property(e => e.ReportStatus).HasColumnName("report_status");
                entity.Property(e => e.Severity).HasColumnName("severity");
                entity.Property(e => e.LiabilityParty).HasColumnName("liability_party");
                entity.Property(e => e.LinkedExceptionId).HasColumnName("linked_exception_id");
                entity.Property(e => e.SettlementDueAt).HasColumnName("settlement_due_at");
                entity.Property(e => e.SupervisorVerdict).HasColumnName("supervisor_verdict");
                entity.Property(e => e.VerdictBy).HasColumnName("verdict_by");
                entity.Property(e => e.VerdictAt).HasColumnName("verdict_at");
                entity.Property(e => e.RepairCostEstimate).HasColumnName("repair_cost_estimate");
                entity.Property(e => e.SubmittedBy).HasColumnName("submitted_by");
                entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");

                entity.Property(e => e.FirstSignOff).HasColumnName("first_sign_off").HasColumnType("jsonb");
                entity.Property(e => e.SecondSignOff).HasColumnName("second_sign_off").HasColumnType("jsonb");
                entity.Property(e => e.CustodyMode).HasColumnName("custody_mode");
                entity.Property(e => e.SelfValidationRecord).HasColumnName("self_validation_record").HasColumnType("jsonb");
                entity.Property(e => e.EmergencyUnblockMetadata).HasColumnName("emergency_unblock_metadata").HasColumnType("jsonb");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.VerdictIssuer).WithMany().HasForeignKey(e => e.VerdictBy);
                entity.HasOne(e => e.Submitter).WithMany().HasForeignKey(e => e.SubmittedBy);
            });

            // 20. Investigation Ticket
            modelBuilder.Entity<InvestigationTicket>(entity =>
            {
                entity.ToTable("investigation_tickets");
                entity.Property(e => e.Id).HasColumnName("ticket_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.ReportId).HasColumnName("report_id");
                entity.Property(e => e.TicketStatus).HasColumnName("ticket_status");
                entity.Property(e => e.OpenedAt).HasColumnName("opened_at");
                entity.Property(e => e.AutoExpireAt).HasColumnName("auto_expire_at");
                entity.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
                entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.DamageReport).WithMany().HasForeignKey(e => e.ReportId);
                entity.HasOne(e => e.Resolver).WithMany().HasForeignKey(e => e.ResolvedBy);
            });

            // 21. Asset Maintenance History
            modelBuilder.Entity<AssetMaintenanceHistory>(entity =>
            {
                entity.ToTable("asset_maintenance_history");
                entity.Property(e => e.Id).HasColumnName("record_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.ReportId).HasColumnName("report_id");
                entity.Property(e => e.RepairCost).HasColumnName("repair_cost");
                entity.Property(e => e.CumulativeRepairCost).HasColumnName("cumulative_repair_cost");
                entity.Property(e => e.DepreciationFlagged).HasColumnName("depreciation_flagged");
                entity.Property(e => e.MaintenanceNotes).HasColumnName("maintenance_notes");
                entity.Property(e => e.RecordedAt).HasColumnName("recorded_at");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.DamageReport).WithMany().HasForeignKey(e => e.ReportId);
            });

            // 22. Event Financials
            modelBuilder.Entity<EventFinancials>(entity =>
            {
                entity.ToTable("event_financials");
                entity.Property(e => e.Id).HasColumnName("financial_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.EstimatedRevenue).HasColumnName("estimated_revenue");
                entity.Property(e => e.QuotationAmount).HasColumnName("quotation_amount");
                entity.Property(e => e.EstimatedAssetCost).HasColumnName("estimated_asset_cost");
                entity.Property(e => e.TotalDamageCosts).HasColumnName("total_damage_costs");
                entity.Property(e => e.TotalLaborCosts).HasColumnName("total_labor_costs");
                entity.Property(e => e.TotalConsumableCosts).HasColumnName("total_consumable_costs");
                entity.Property(e => e.TotalEmergencyPurchases).HasColumnName("total_emergency_purchases");
                entity.Property(e => e.EstimatedGrossMargin).HasColumnName("estimated_gross_margin");
                entity.Property(e => e.IsLossMaker).HasColumnName("is_loss_maker");
                entity.Property(e => e.LossMakerAcknowledgedBy).HasColumnName("loss_maker_acknowledged_by");
                entity.Property(e => e.LossMakerAcknowledgedAt).HasColumnName("loss_maker_acknowledged_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasIndex(e => e.EventId).IsUnique();
                entity.HasOne(e => e.Event).WithOne().HasForeignKey<EventFinancials>(e => e.EventId);
                entity.HasOne(e => e.Acknowledger).WithMany().HasForeignKey(e => e.LossMakerAcknowledgedBy);
            });

            // 23. Audit Log
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_log");
                entity.Property(e => e.Id).HasColumnName("log_id");
                entity.Property(e => e.ActorId).HasColumnName("actor_id");
                entity.Property(e => e.ActionType).HasColumnName("action_type");
                entity.Property(e => e.AffectedTable).HasColumnName("affected_table");
                entity.Property(e => e.AffectedRecordId).HasColumnName("affected_record_id");
                entity.Property(e => e.PreviousState)
                    .HasColumnName("previous_state")
                    .HasColumnType("jsonb")
                    .HasConversion(
                        v => v == null ? null : v.RootElement.GetRawText(),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonDocument.Parse(v, default));

                entity.Property(e => e.NewState)
                    .HasColumnName("new_state")
                    .HasColumnType("jsonb")
                    .HasConversion(
                        v => v == null ? null : v.RootElement.GetRawText(),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonDocument.Parse(v, default));
                entity.Property(e => e.LoggedAt).HasColumnName("logged_at");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address");

                entity.HasOne(e => e.Actor).WithMany().HasForeignKey(e => e.ActorId);
            });

            // Blacklisted Token
            modelBuilder.Entity<BlacklistedToken>(entity =>
            {
                entity.ToTable("blacklisted_tokens");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Jti).HasColumnName("jti");
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.TargetUserId).HasColumnName("target_user_id");
                entity.Property(e => e.TargetRoleId).HasColumnName("target_role_id");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Message).HasColumnName("message");
                entity.Property(e => e.IsRead).HasColumnName("is_read");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Event Viewer
            modelBuilder.Entity<EventViewer>(entity =>
            {
                entity.ToTable("event_viewers");
                entity.HasKey(e => new { e.EventId, e.UserId });
                entity.Property(e => e.ViewerId).HasColumnName("viewer_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AccessLevel).HasColumnName("access_level");
                entity.Property(e => e.GrantedBy).HasColumnName("granted_by");
                entity.Property(e => e.GrantedAt).HasColumnName("granted_at");
                entity.Property(e => e.RevokedBy).HasColumnName("revoked_by");
                entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
                entity.HasOne(e => e.Grantor).WithMany().HasForeignKey(e => e.GrantedBy);
                entity.HasOne(e => e.Revoker).WithMany().HasForeignKey(e => e.RevokedBy);
            });

            // Manning Assignment
            modelBuilder.Entity<ManningAssignment>(entity =>
            {
                entity.ToTable("manning_assignments");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.RoleName).HasColumnName("role_name");
                entity.Property(e => e.ShiftDate).HasColumnName("shift_date");
                entity.Property(e => e.ShiftStartTime).HasColumnName("shift_start_time");
                entity.Property(e => e.ShiftEndTime).HasColumnName("shift_end_time");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            });

            // 19. Damage Report
            modelBuilder.Entity<DamageReport>(entity =>
            {
                entity.ToTable("damage_reports");
                entity.Property(e => e.Id).HasColumnName("report_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.BatchId).HasColumnName("batch_id");
                entity.Property(e => e.PhotoUrl).HasColumnName("photo_url");
                entity.Property(e => e.Sha256Hash).HasColumnName("sha256_hash");
                entity.Property(e => e.ExifMetadata).HasColumnName("exif_metadata").HasColumnType("jsonb");
                entity.Property(e => e.IsTemporallyValid).HasColumnName("is_temporally_valid");
                entity.Property(e => e.NoPhotographicEvidence).HasColumnName("no_photographic_evidence");
                entity.Property(e => e.DamagedQuantity).HasColumnName("damaged_quantity");
                entity.Property(e => e.ReportStatus).HasColumnName("report_status");
                entity.Property(e => e.Severity).HasColumnName("severity");
                entity.Property(e => e.LiabilityParty).HasColumnName("liability_party");
                entity.Property(e => e.LinkedExceptionId).HasColumnName("linked_exception_id");
                entity.Property(e => e.SettlementDueAt).HasColumnName("settlement_due_at");
                entity.Property(e => e.SupervisorVerdict).HasColumnName("supervisor_verdict");
                entity.Property(e => e.VerdictBy).HasColumnName("verdict_by");
                entity.Property(e => e.VerdictAt).HasColumnName("verdict_at");
                entity.Property(e => e.RepairCostEstimate).HasColumnName("repair_cost_estimate");
                entity.Property(e => e.SubmittedBy).HasColumnName("submitted_by");
                entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");

                entity.Property(e => e.FirstSignOff).HasColumnName("first_sign_off").HasColumnType("jsonb");
                entity.Property(e => e.SecondSignOff).HasColumnName("second_sign_off").HasColumnType("jsonb");
                entity.Property(e => e.CustodyMode).HasColumnName("custody_mode");
                entity.Property(e => e.SelfValidationRecord).HasColumnName("self_validation_record").HasColumnType("jsonb");
                entity.Property(e => e.EmergencyUnblockMetadata).HasColumnName("emergency_unblock_metadata").HasColumnType("jsonb");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.VerdictIssuer).WithMany().HasForeignKey(e => e.VerdictBy);
                entity.HasOne(e => e.Submitter).WithMany().HasForeignKey(e => e.SubmittedBy);
            });

            // 20. Investigation Ticket
            modelBuilder.Entity<InvestigationTicket>(entity =>
            {
                entity.ToTable("investigation_tickets");
                entity.Property(e => e.Id).HasColumnName("ticket_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.ReportId).HasColumnName("report_id");
                entity.Property(e => e.TicketStatus).HasColumnName("ticket_status");
                entity.Property(e => e.OpenedAt).HasColumnName("opened_at");
                entity.Property(e => e.AutoExpireAt).HasColumnName("auto_expire_at");
                entity.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
                entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.DamageReport).WithMany().HasForeignKey(e => e.ReportId);
                entity.HasOne(e => e.Resolver).WithMany().HasForeignKey(e => e.ResolvedBy);
            });

            // 21. Asset Maintenance History
            modelBuilder.Entity<AssetMaintenanceHistory>(entity =>
            {
                entity.ToTable("asset_maintenance_history");
                entity.Property(e => e.Id).HasColumnName("record_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.ReportId).HasColumnName("report_id");
                entity.Property(e => e.RepairCost).HasColumnName("repair_cost");
                entity.Property(e => e.CumulativeRepairCost).HasColumnName("cumulative_repair_cost");
                entity.Property(e => e.DepreciationFlagged).HasColumnName("depreciation_flagged");
                entity.Property(e => e.MaintenanceNotes).HasColumnName("maintenance_notes");
                entity.Property(e => e.RecordedAt).HasColumnName("recorded_at");

                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.DamageReport).WithMany().HasForeignKey(e => e.ReportId);
            });

            // 22. Event Financials
            modelBuilder.Entity<EventFinancials>(entity =>
            {
                entity.ToTable("event_financials");
                entity.Property(e => e.Id).HasColumnName("financial_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.EstimatedRevenue).HasColumnName("estimated_revenue");
                entity.Property(e => e.QuotationAmount).HasColumnName("quotation_amount");
                entity.Property(e => e.EstimatedAssetCost).HasColumnName("estimated_asset_cost");
                entity.Property(e => e.TotalDamageCosts).HasColumnName("total_damage_costs");
                entity.Property(e => e.TotalLaborCosts).HasColumnName("total_labor_costs");
                entity.Property(e => e.TotalConsumableCosts).HasColumnName("total_consumable_costs");
                entity.Property(e => e.TotalEmergencyPurchases).HasColumnName("total_emergency_purchases");
                entity.Property(e => e.EstimatedGrossMargin).HasColumnName("estimated_gross_margin");
                entity.Property(e => e.IsLossMaker).HasColumnName("is_loss_maker");
                entity.Property(e => e.LossMakerAcknowledgedBy).HasColumnName("loss_maker_acknowledged_by");
                entity.Property(e => e.LossMakerAcknowledgedAt).HasColumnName("loss_maker_acknowledged_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasIndex(e => e.EventId).IsUnique();
                entity.HasOne(e => e.Event).WithOne().HasForeignKey<EventFinancials>(e => e.EventId);
                entity.HasOne(e => e.Acknowledger).WithMany().HasForeignKey(e => e.LossMakerAcknowledgedBy);
            });

            // 23. Audit Log
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_log");
                entity.Property(e => e.Id).HasColumnName("log_id");
                entity.Property(e => e.ActorId).HasColumnName("actor_id");
                entity.Property(e => e.ActionType).HasColumnName("action_type");
                entity.Property(e => e.AffectedTable).HasColumnName("affected_table");
                entity.Property(e => e.AffectedRecordId).HasColumnName("affected_record_id");
                entity.Property(e => e.PreviousState)
                    .HasColumnName("previous_state")
                    .HasColumnType("jsonb")
                    .HasConversion(
                        v => v == null ? null : v.RootElement.GetRawText(),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonDocument.Parse(v, default));

                entity.Property(e => e.NewState)
                    .HasColumnName("new_state")
                    .HasColumnType("jsonb")
                    .HasConversion(
                        v => v == null ? null : v.RootElement.GetRawText(),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonDocument.Parse(v, default));
                entity.Property(e => e.LoggedAt).HasColumnName("logged_at");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address");

                entity.HasOne(e => e.Actor).WithMany().HasForeignKey(e => e.ActorId);
            });

            // Blacklisted Token
            modelBuilder.Entity<BlacklistedToken>(entity =>
            {
                entity.ToTable("blacklisted_tokens");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Jti).HasColumnName("jti");
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.TargetUserId).HasColumnName("target_user_id");
                entity.Property(e => e.TargetRoleId).HasColumnName("target_role_id");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Message).HasColumnName("message");
                entity.Property(e => e.IsRead).HasColumnName("is_read");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Event Viewer
            modelBuilder.Entity<EventViewer>(entity =>
            {
                entity.ToTable("event_viewers");
                entity.HasKey(e => new { e.EventId, e.UserId });
                entity.Property(e => e.ViewerId).HasColumnName("viewer_id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AccessLevel).HasColumnName("access_level");
                entity.Property(e => e.GrantedBy).HasColumnName("granted_by");
                entity.Property(e => e.GrantedAt).HasColumnName("granted_at");
                entity.Property(e => e.RevokedBy).HasColumnName("revoked_by");
                entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
                entity.HasOne(e => e.Grantor).WithMany().HasForeignKey(e => e.GrantedBy);
                entity.HasOne(e => e.Revoker).WithMany().HasForeignKey(e => e.RevokedBy);
            });

            // Manning Assignment
            modelBuilder.Entity<ManningAssignment>(entity =>
            {
                entity.ToTable("manning_assignments");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.RoleName).HasColumnName("role_name");
                entity.Property(e => e.ShiftDate).HasColumnName("shift_date");
                entity.Property(e => e.ShiftStartTime).HasColumnName("shift_start_time");
                entity.Property(e => e.ShiftEndTime).HasColumnName("shift_end_time");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.IsOverride).HasColumnName("is_override");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            });

            // Production Task
            modelBuilder.Entity<ProductionTask>(entity =>
            {
                entity.ToTable("production_tasks");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.TaskName).HasColumnName("task_name");
                entity.Property(e => e.Category).HasColumnName("category");
                entity.Property(e => e.TargetQuantity).HasColumnName("target_quantity");
                entity.Property(e => e.CompletedQuantity).HasColumnName("completed_quantity");
                entity.Property(e => e.ProgressPercentage).HasColumnName("progress_percentage");
                entity.Property(e => e.StartDate).HasColumnName("start_date");
                entity.Property(e => e.EndDate).HasColumnName("end_date");
                entity.Property(e => e.AssignedToUserId).HasColumnName("assigned_to_user_id");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.AssignedUser).WithMany().HasForeignKey(e => e.AssignedToUserId);
            });

            // Production Quota
            modelBuilder.Entity<ProductionQuota>(entity =>
            {
                entity.ToTable("production_quotas");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Department).HasColumnName("department");
                entity.Property(e => e.DailyTargetUnits).HasColumnName("daily_target_units");
                entity.Property(e => e.EffectiveDate).HasColumnName("effective_date");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // Field Report Queue Item
            modelBuilder.Entity<FieldReportQueueItem>(entity =>
            {
                entity.ToTable("field_report_queue_items");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.ClientTxId).HasColumnName("client_tx_id");
                entity.Property(e => e.EventType).HasColumnName("event_type");
                entity.Property(e => e.EventId).HasColumnName("event_id");
                entity.Property(e => e.AssetId).HasColumnName("asset_id");
                entity.Property(e => e.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
                entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
                entity.Property(e => e.ProcessedAt).HasColumnName("processed_at");
                entity.Property(e => e.SubmittedBy).HasColumnName("submitted_by");

                entity.HasIndex(e => e.ClientTxId).IsUnique();

                entity.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId);
                entity.HasOne(e => e.Asset).WithMany().HasForeignKey(e => e.AssetId);
                entity.HasOne(e => e.Submitter).WithMany().HasForeignKey(e => e.SubmittedBy);
            });
        }
    }
}
