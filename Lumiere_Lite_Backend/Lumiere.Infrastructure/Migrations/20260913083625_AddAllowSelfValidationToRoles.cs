using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumiere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAllowSelfValidationToRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "allow_self_validation",
                table: "roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "backup_vendor_id",
                table: "deficit_queue",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "cost_per_unit",
                table: "deficit_queue",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "current_stock",
                table: "deficit_queue",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "eta_hours",
                table: "deficit_queue",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "po_ref",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "primary_vendor_id",
                table: "deficit_queue",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "priority",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "reorder_qty",
                table: "deficit_queue",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "supplier",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "tagged_for_dispatch",
                table: "deficit_queue",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "threshold",
                table: "deficit_queue",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "trigger_source",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "unit",
                table: "deficit_queue",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "batch_id",
                table: "damage_reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "custody_mode",
                table: "damage_reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "emergency_unblock_metadata",
                table: "damage_reports",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "first_sign_off",
                table: "damage_reports",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "liability_party",
                table: "damage_reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "linked_exception_id",
                table: "damage_reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "no_photographic_evidence",
                table: "damage_reports",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "second_sign_off",
                table: "damage_reports",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "self_validation_record",
                table: "damage_reports",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "settlement_due_at",
                table: "damage_reports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "severity",
                table: "damage_reports",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "field_report_queue_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    client_tx_id = table.Column<string>(type: "text", nullable: false),
                    event_type = table.Column<string>(type: "text", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: true),
                    payload_json = table.Column<string>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    submitted_by = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_field_report_queue_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_field_report_queue_items_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_field_report_queue_items_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_field_report_queue_items_users_submitted_by",
                        column: x => x.submitted_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "manning_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_name = table.Column<string>(type: "text", nullable: false),
                    shift_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    shift_start_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    shift_end_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_override = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manning_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_manning_assignments_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_manning_assignments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "production_quotas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    department = table.Column<string>(type: "text", nullable: false),
                    daily_target_units = table.Column<int>(type: "integer", nullable: false),
                    effective_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_quotas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "production_tasks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_name = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    target_quantity = table.Column<int>(type: "integer", nullable: false),
                    completed_quantity = table.Column<int>(type: "integer", nullable: false),
                    progress_percentage = table.Column<decimal>(type: "numeric", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    assigned_to_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_production_tasks_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_production_tasks_users_assigned_to_user_id",
                        column: x => x.assigned_to_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_backup_vendor_id",
                table: "deficit_queue",
                column: "backup_vendor_id");

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_primary_vendor_id",
                table: "deficit_queue",
                column: "primary_vendor_id");

            migrationBuilder.CreateIndex(
                name: "IX_field_report_queue_items_asset_id",
                table: "field_report_queue_items",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_field_report_queue_items_client_tx_id",
                table: "field_report_queue_items",
                column: "client_tx_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_field_report_queue_items_event_id",
                table: "field_report_queue_items",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_field_report_queue_items_submitted_by",
                table: "field_report_queue_items",
                column: "submitted_by");

            migrationBuilder.CreateIndex(
                name: "IX_manning_assignments_event_id",
                table: "manning_assignments",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_manning_assignments_user_id",
                table: "manning_assignments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_tasks_assigned_to_user_id",
                table: "production_tasks",
                column: "assigned_to_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_tasks_event_id",
                table: "production_tasks",
                column: "event_id");

            migrationBuilder.AddForeignKey(
                name: "FK_deficit_queue_vendors_backup_vendor_id",
                table: "deficit_queue",
                column: "backup_vendor_id",
                principalTable: "vendors",
                principalColumn: "vendor_id");

            migrationBuilder.AddForeignKey(
                name: "FK_deficit_queue_vendors_primary_vendor_id",
                table: "deficit_queue",
                column: "primary_vendor_id",
                principalTable: "vendors",
                principalColumn: "vendor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_deficit_queue_vendors_backup_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropForeignKey(
                name: "FK_deficit_queue_vendors_primary_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropTable(
                name: "field_report_queue_items");

            migrationBuilder.DropTable(
                name: "manning_assignments");

            migrationBuilder.DropTable(
                name: "production_quotas");

            migrationBuilder.DropTable(
                name: "production_tasks");

            migrationBuilder.DropIndex(
                name: "IX_deficit_queue_backup_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropIndex(
                name: "IX_deficit_queue_primary_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "allow_self_validation",
                table: "roles");

            migrationBuilder.DropColumn(
                name: "backup_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "category",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "cost_per_unit",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "current_stock",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "eta_hours",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "po_ref",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "primary_vendor_id",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "priority",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "reorder_qty",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "supplier",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "tagged_for_dispatch",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "threshold",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "trigger_source",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "unit",
                table: "deficit_queue");

            migrationBuilder.DropColumn(
                name: "batch_id",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "custody_mode",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "emergency_unblock_metadata",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "first_sign_off",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "liability_party",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "linked_exception_id",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "no_photographic_evidence",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "second_sign_off",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "self_validation_record",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "settlement_due_at",
                table: "damage_reports");

            migrationBuilder.DropColumn(
                name: "severity",
                table: "damage_reports");
        }
    }
}
