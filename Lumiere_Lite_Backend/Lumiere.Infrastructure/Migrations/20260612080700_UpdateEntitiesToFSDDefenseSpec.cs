using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumiere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEntitiesToFSDDefenseSpec : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asset_types",
                columns: table => new
                {
                    asset_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_type_name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_types", x => x.asset_type_id);
                });

            migrationBuilder.CreateTable(
                name: "blacklisted_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jti = table.Column<string>(type: "text", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blacklisted_tokens", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "events",
                columns: table => new
                {
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_name = table.Column<string>(type: "text", nullable: false),
                    date_of_event = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ingress_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ingress_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    full_stop = table.Column<TimeSpan>(type: "interval", nullable: false),
                    event_venue = table.Column<string>(type: "text", nullable: false),
                    geo_class = table.Column<string>(type: "text", nullable: false),
                    mobilization_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    return_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    transit_buffer_days = table.Column<int>(type: "integer", nullable: false),
                    event_pegs = table.Column<string>(type: "text", nullable: true),
                    color_palette = table.Column<string>(type: "text", nullable: true),
                    branding_and_textures = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    estimated_revenue = table.Column<decimal>(type: "numeric", nullable: true),
                    is_loss_maker = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_events", x => x.event_id);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    target_role_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_name = table.Column<string>(type: "text", nullable: false),
                    role_description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.role_id);
                });

            migrationBuilder.CreateTable(
                name: "vendors",
                columns: table => new
                {
                    vendor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vendor_name = table.Column<string>(type: "text", nullable: false),
                    address = table.Column<string>(type: "text", nullable: true),
                    vendor_notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendors", x => x.vendor_id);
                });

            migrationBuilder.CreateTable(
                name: "asset_sub_types",
                columns: table => new
                {
                    asset_sub_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_sub_type_name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_sub_types", x => x.asset_sub_type_id);
                    table.ForeignKey(
                        name: "FK_asset_sub_types_asset_types_asset_type_id",
                        column: x => x.asset_type_id,
                        principalTable: "asset_types",
                        principalColumn: "asset_type_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    contact_number = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_users_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vendor_representatives",
                columns: table => new
                {
                    representative_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vendor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    representative_name = table.Column<string>(type: "text", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_representatives", x => x.representative_id);
                    table.ForeignKey(
                        name: "FK_vendor_representatives_vendors_vendor_id",
                        column: x => x.vendor_id,
                        principalTable: "vendors",
                        principalColumn: "vendor_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assets",
                columns: table => new
                {
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    asset_sub_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    asset_tier = table.Column<int>(type: "integer", nullable: false),
                    asset_state = table.Column<string>(type: "text", nullable: false),
                    asset_name = table.Column<string>(type: "text", nullable: false),
                    item_call_name = table.Column<string>(type: "text", nullable: true),
                    item_description = table.Column<string>(type: "text", nullable: true),
                    base_count = table.Column<int>(type: "integer", nullable: false),
                    unit = table.Column<string>(type: "text", nullable: false),
                    cost = table.Column<decimal>(type: "numeric", nullable: true),
                    shape = table.Column<string>(type: "text", nullable: true),
                    height = table.Column<decimal>(type: "numeric", nullable: true),
                    width = table.Column<decimal>(type: "numeric", nullable: true),
                    weight = table.Column<decimal>(type: "numeric", nullable: true),
                    is_circular = table.Column<bool>(type: "boolean", nullable: false),
                    circumference = table.Column<decimal>(type: "numeric", nullable: true),
                    is_mono_color = table.Column<bool>(type: "boolean", nullable: false),
                    is_multi_color = table.Column<bool>(type: "boolean", nullable: false),
                    is_changeable_color = table.Column<bool>(type: "boolean", nullable: false),
                    origin = table.Column<string>(type: "text", nullable: true),
                    material = table.Column<string>(type: "text", nullable: true),
                    is_fragile = table.Column<bool>(type: "boolean", nullable: false),
                    kitting_data = table.Column<string>(type: "jsonb", nullable: true),
                    photo_url = table.Column<string>(type: "text", nullable: true),
                    original_value = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assets", x => x.asset_id);
                    table.ForeignKey(
                        name: "FK_assets_asset_sub_types_asset_sub_type_id",
                        column: x => x.asset_sub_type_id,
                        principalTable: "asset_sub_types",
                        principalColumn: "asset_sub_type_id");
                    table.ForeignKey(
                        name: "FK_assets_asset_types_asset_type_id",
                        column: x => x.asset_type_id,
                        principalTable: "asset_types",
                        principalColumn: "asset_type_id");
                });

            migrationBuilder.CreateTable(
                name: "audit_log",
                columns: table => new
                {
                    log_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action_type = table.Column<string>(type: "text", nullable: false),
                    affected_table = table.Column<string>(type: "text", nullable: true),
                    affected_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    previous_state = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    new_state = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    logged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ip_address = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_log", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_audit_log_users_actor_id",
                        column: x => x.actor_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "ephemeral_permissions",
                columns: table => new
                {
                    perm_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    temp_role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    auth_reason = table.Column<string>(type: "text", nullable: false),
                    granted_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ephemeral_permissions", x => x.perm_id);
                    table.ForeignKey(
                        name: "FK_ephemeral_permissions_roles_temp_role_id",
                        column: x => x.temp_role_id,
                        principalTable: "roles",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ephemeral_permissions_users_granted_by",
                        column: x => x.granted_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ephemeral_permissions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_canvases",
                columns: table => new
                {
                    canvas_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    canvas_state = table.Column<string>(type: "jsonb", nullable: true),
                    annotation_state = table.Column<string>(type: "jsonb", nullable: true),
                    pdf_url = table.Column<string>(type: "text", nullable: true),
                    canvas_mode = table.Column<string>(type: "text", nullable: false),
                    canvas_status = table.Column<string>(type: "text", nullable: false),
                    submitted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_canvases", x => x.canvas_id);
                    table.ForeignKey(
                        name: "FK_event_canvases_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_canvases_users_approved_by",
                        column: x => x.approved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_event_canvases_users_submitted_by",
                        column: x => x.submitted_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "event_financials",
                columns: table => new
                {
                    financial_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    estimated_revenue = table.Column<decimal>(type: "numeric", nullable: true),
                    quotation_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    estimated_asset_cost = table.Column<decimal>(type: "numeric", nullable: false),
                    total_damage_costs = table.Column<decimal>(type: "numeric", nullable: false),
                    total_labor_costs = table.Column<decimal>(type: "numeric", nullable: false),
                    total_consumable_costs = table.Column<decimal>(type: "numeric", nullable: false),
                    total_emergency_purchases = table.Column<decimal>(type: "numeric", nullable: false),
                    estimated_gross_margin = table.Column<decimal>(type: "numeric", nullable: false),
                    is_loss_maker = table.Column<bool>(type: "boolean", nullable: false),
                    loss_maker_acknowledged_by = table.Column<Guid>(type: "uuid", nullable: true),
                    loss_maker_acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_financials", x => x.financial_id);
                    table.ForeignKey(
                        name: "FK_event_financials_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_financials_users_loss_maker_acknowledged_by",
                        column: x => x.loss_maker_acknowledged_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "vendor_contact_numbers",
                columns: table => new
                {
                    contact_number_id = table.Column<Guid>(type: "uuid", nullable: false),
                    representative_id = table.Column<Guid>(type: "uuid", nullable: false),
                    contact_number = table.Column<string>(type: "text", nullable: false),
                    number_label = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_contact_numbers", x => x.contact_number_id);
                    table.ForeignKey(
                        name: "FK_vendor_contact_numbers_vendor_representatives_representativ~",
                        column: x => x.representative_id,
                        principalTable: "vendor_representatives",
                        principalColumn: "representative_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vendor_contact_platforms",
                columns: table => new
                {
                    platform_id = table.Column<Guid>(type: "uuid", nullable: false),
                    representative_id = table.Column<Guid>(type: "uuid", nullable: false),
                    platform_type = table.Column<string>(type: "text", nullable: false),
                    platform_value = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_contact_platforms", x => x.platform_id);
                    table.ForeignKey(
                        name: "FK_vendor_contact_platforms_vendor_representatives_representat~",
                        column: x => x.representative_id,
                        principalTable: "vendor_representatives",
                        principalColumn: "representative_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asset_colors",
                columns: table => new
                {
                    color_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    hex_value = table.Column<string>(type: "text", nullable: false),
                    paint_brand = table.Column<string>(type: "text", nullable: true),
                    material_finish = table.Column<string>(type: "text", nullable: true),
                    color_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_colors", x => x.color_id);
                    table.ForeignKey(
                        name: "FK_asset_colors_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asset_reservations",
                columns: table => new
                {
                    res_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lock_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    lock_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_provisional = table.Column<bool>(type: "boolean", nullable: false),
                    reserved_by = table.Column<Guid>(type: "uuid", nullable: false),
                    reserved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_reservations", x => x.res_id);
                    table.ForeignKey(
                        name: "FK_asset_reservations_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_reservations_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_reservations_users_reserved_by",
                        column: x => x.reserved_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asset_tags",
                columns: table => new
                {
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_value = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_tags", x => x.tag_id);
                    table.ForeignKey(
                        name: "FK_asset_tags_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asset_vendors",
                columns: table => new
                {
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vendor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rental_period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rental_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rental_cost = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_vendors", x => new { x.asset_id, x.vendor_id });
                    table.ForeignKey(
                        name: "FK_asset_vendors_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_vendors_vendors_vendor_id",
                        column: x => x.vendor_id,
                        principalTable: "vendors",
                        principalColumn: "vendor_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "damage_reports",
                columns: table => new
                {
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    photo_url = table.Column<string>(type: "text", nullable: false),
                    sha256_hash = table.Column<string>(type: "text", nullable: false),
                    exif_metadata = table.Column<string>(type: "jsonb", nullable: true),
                    is_temporally_valid = table.Column<bool>(type: "boolean", nullable: false),
                    damaged_quantity = table.Column<int>(type: "integer", nullable: false),
                    report_status = table.Column<string>(type: "text", nullable: false),
                    supervisor_verdict = table.Column<string>(type: "text", nullable: true),
                    verdict_by = table.Column<Guid>(type: "uuid", nullable: true),
                    verdict_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    repair_cost_estimate = table.Column<decimal>(type: "numeric", nullable: true),
                    submitted_by = table.Column<Guid>(type: "uuid", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_damage_reports", x => x.report_id);
                    table.ForeignKey(
                        name: "FK_damage_reports_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_damage_reports_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_damage_reports_users_submitted_by",
                        column: x => x.submitted_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_damage_reports_users_verdict_by",
                        column: x => x.verdict_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "deficit_queue",
                columns: table => new
                {
                    deficit_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: true),
                    asset_description = table.Column<string>(type: "text", nullable: true),
                    quantity_needed = table.Column<int>(type: "integer", nullable: false),
                    deficit_status = table.Column<string>(type: "text", nullable: false),
                    flagged_by = table.Column<Guid>(type: "uuid", nullable: false),
                    flagged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resolved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deficit_queue", x => x.deficit_id);
                    table.ForeignKey(
                        name: "FK_deficit_queue_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_deficit_queue_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_deficit_queue_users_flagged_by",
                        column: x => x.flagged_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_deficit_queue_users_resolved_by",
                        column: x => x.resolved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "dispatch_preparation_queue",
                columns: table => new
                {
                    prep_queue_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    canvas_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity_required = table.Column<int>(type: "integer", nullable: false),
                    prep_status = table.Column<string>(type: "text", nullable: false),
                    assigned_to = table.Column<Guid>(type: "uuid", nullable: true),
                    prep_notes = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dispatch_preparation_queue", x => x.prep_queue_id);
                    table.ForeignKey(
                        name: "FK_dispatch_preparation_queue_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_dispatch_preparation_queue_event_canvases_canvas_id",
                        column: x => x.canvas_id,
                        principalTable: "event_canvases",
                        principalColumn: "canvas_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_dispatch_preparation_queue_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_dispatch_preparation_queue_users_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_dispatch_preparation_queue_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "asset_maintenance_history",
                columns: table => new
                {
                    record_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    repair_cost = table.Column<decimal>(type: "numeric", nullable: false),
                    cumulative_repair_cost = table.Column<decimal>(type: "numeric", nullable: false),
                    depreciation_flagged = table.Column<bool>(type: "boolean", nullable: false),
                    maintenance_notes = table.Column<string>(type: "text", nullable: true),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_maintenance_history", x => x.record_id);
                    table.ForeignKey(
                        name: "FK_asset_maintenance_history_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_maintenance_history_damage_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "damage_reports",
                        principalColumn: "report_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_maintenance_history_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "investigation_tickets",
                columns: table => new
                {
                    ticket_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    report_id = table.Column<Guid>(type: "uuid", nullable: true),
                    ticket_status = table.Column<string>(type: "text", nullable: false),
                    opened_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    auto_expire_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resolved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_investigation_tickets", x => x.ticket_id);
                    table.ForeignKey(
                        name: "FK_investigation_tickets_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_investigation_tickets_damage_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "damage_reports",
                        principalColumn: "report_id");
                    table.ForeignKey(
                        name: "FK_investigation_tickets_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id");
                    table.ForeignKey(
                        name: "FK_investigation_tickets_users_resolved_by",
                        column: x => x.resolved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_asset_colors_asset_id",
                table: "asset_colors",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_maintenance_history_asset_id",
                table: "asset_maintenance_history",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_maintenance_history_event_id",
                table: "asset_maintenance_history",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_maintenance_history_report_id",
                table: "asset_maintenance_history",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_reservations_asset_id",
                table: "asset_reservations",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_reservations_event_id",
                table: "asset_reservations",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_reservations_reserved_by",
                table: "asset_reservations",
                column: "reserved_by");

            migrationBuilder.CreateIndex(
                name: "IX_asset_sub_types_asset_type_id",
                table: "asset_sub_types",
                column: "asset_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_tags_asset_id",
                table: "asset_tags",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_asset_vendors_vendor_id",
                table: "asset_vendors",
                column: "vendor_id");

            migrationBuilder.CreateIndex(
                name: "IX_assets_asset_sub_type_id",
                table: "assets",
                column: "asset_sub_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_assets_asset_type_id",
                table: "assets",
                column: "asset_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_actor_id",
                table: "audit_log",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "IX_damage_reports_asset_id",
                table: "damage_reports",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_damage_reports_event_id",
                table: "damage_reports",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_damage_reports_submitted_by",
                table: "damage_reports",
                column: "submitted_by");

            migrationBuilder.CreateIndex(
                name: "IX_damage_reports_verdict_by",
                table: "damage_reports",
                column: "verdict_by");

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_asset_id",
                table: "deficit_queue",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_event_id",
                table: "deficit_queue",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_flagged_by",
                table: "deficit_queue",
                column: "flagged_by");

            migrationBuilder.CreateIndex(
                name: "IX_deficit_queue_resolved_by",
                table: "deficit_queue",
                column: "resolved_by");

            migrationBuilder.CreateIndex(
                name: "IX_dispatch_preparation_queue_asset_id",
                table: "dispatch_preparation_queue",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispatch_preparation_queue_assigned_to",
                table: "dispatch_preparation_queue",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_dispatch_preparation_queue_canvas_id",
                table: "dispatch_preparation_queue",
                column: "canvas_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispatch_preparation_queue_event_id",
                table: "dispatch_preparation_queue",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispatch_preparation_queue_updated_by",
                table: "dispatch_preparation_queue",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_ephemeral_permissions_granted_by",
                table: "ephemeral_permissions",
                column: "granted_by");

            migrationBuilder.CreateIndex(
                name: "IX_ephemeral_permissions_temp_role_id",
                table: "ephemeral_permissions",
                column: "temp_role_id");

            migrationBuilder.CreateIndex(
                name: "IX_ephemeral_permissions_user_id",
                table: "ephemeral_permissions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_canvases_approved_by",
                table: "event_canvases",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_event_canvases_event_id",
                table: "event_canvases",
                column: "event_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_event_canvases_submitted_by",
                table: "event_canvases",
                column: "submitted_by");

            migrationBuilder.CreateIndex(
                name: "IX_event_financials_event_id",
                table: "event_financials",
                column: "event_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_event_financials_loss_maker_acknowledged_by",
                table: "event_financials",
                column: "loss_maker_acknowledged_by");

            migrationBuilder.CreateIndex(
                name: "IX_investigation_tickets_asset_id",
                table: "investigation_tickets",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_investigation_tickets_event_id",
                table: "investigation_tickets",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_investigation_tickets_report_id",
                table: "investigation_tickets",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "IX_investigation_tickets_resolved_by",
                table: "investigation_tickets",
                column: "resolved_by");

            migrationBuilder.CreateIndex(
                name: "IX_users_role_id",
                table: "users",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_contact_numbers_representative_id",
                table: "vendor_contact_numbers",
                column: "representative_id");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_contact_platforms_representative_id",
                table: "vendor_contact_platforms",
                column: "representative_id");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_representatives_vendor_id",
                table: "vendor_representatives",
                column: "vendor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asset_colors");

            migrationBuilder.DropTable(
                name: "asset_maintenance_history");

            migrationBuilder.DropTable(
                name: "asset_reservations");

            migrationBuilder.DropTable(
                name: "asset_tags");

            migrationBuilder.DropTable(
                name: "asset_vendors");

            migrationBuilder.DropTable(
                name: "audit_log");

            migrationBuilder.DropTable(
                name: "blacklisted_tokens");

            migrationBuilder.DropTable(
                name: "deficit_queue");

            migrationBuilder.DropTable(
                name: "dispatch_preparation_queue");

            migrationBuilder.DropTable(
                name: "ephemeral_permissions");

            migrationBuilder.DropTable(
                name: "event_financials");

            migrationBuilder.DropTable(
                name: "investigation_tickets");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "vendor_contact_numbers");

            migrationBuilder.DropTable(
                name: "vendor_contact_platforms");

            migrationBuilder.DropTable(
                name: "event_canvases");

            migrationBuilder.DropTable(
                name: "damage_reports");

            migrationBuilder.DropTable(
                name: "vendor_representatives");

            migrationBuilder.DropTable(
                name: "assets");

            migrationBuilder.DropTable(
                name: "events");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "vendors");

            migrationBuilder.DropTable(
                name: "asset_sub_types");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "asset_types");
        }
    }
}
