using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumiere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventViewers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "event_viewers",
                columns: table => new
                {
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    viewer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    access_level = table.Column<string>(type: "text", nullable: false),
                    granted_by = table.Column<Guid>(type: "uuid", nullable: false),
                    granted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    revoked_by = table.Column<Guid>(type: "uuid", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_viewers", x => new { x.event_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_event_viewers_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "event_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_viewers_users_granted_by",
                        column: x => x.granted_by,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_viewers_users_revoked_by",
                        column: x => x.revoked_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_event_viewers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_event_viewers_granted_by",
                table: "event_viewers",
                column: "granted_by");

            migrationBuilder.CreateIndex(
                name: "IX_event_viewers_revoked_by",
                table: "event_viewers",
                column: "revoked_by");

            migrationBuilder.CreateIndex(
                name: "IX_event_viewers_user_id",
                table: "event_viewers",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "event_viewers");
        }
    }
}
