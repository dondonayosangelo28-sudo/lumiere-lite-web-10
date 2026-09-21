using Lumiere.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lumiere.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(AppDbContext context, bool isProduction = false)
        {
            // 1. Ensure database schema is migrated/created
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }

            // 2. Define the three active account types. Existing legacy role rows are
            // intentionally left untouched so this initializer never deletes real data.
            var requiredRoles = new List<(string Name, string Description, bool AllowSelfVal)>
            {
                ("Admin", "Full administrative control", true),
                ("Executive", "Executive insights and portfolio overview", false),
                ("WOM", "Warehouse operations, inventory, replenishment and purchasing", true)
            };

            foreach (var r in requiredRoles)
            {
                var existingRole = await context.Roles.FirstOrDefaultAsync(role => role.Name == r.Name);
                if (existingRole == null)
                {
                    context.Roles.Add(new Role
                    {
                        Name = r.Name,
                        Description = r.Description,
                        AllowSelfValidation = r.AllowSelfVal
                    });
                }
            }

            await context.SaveChangesAsync();

            // 3. Seed demo accounts matching frontend matrix with BCrypt hash for "lumiere2026"
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("lumiere2026", workFactor: 12);

            var demoUsers = new List<(string Email, string FullName, string RoleName)>
            {
                ("admin@lumiere.com", "Admin User", "Admin"),
                ("executive@lumiere.com", "Executive User", "Executive"),
                ("warehouseops@lumiere.com", "Warehouse User", "WOM")
            };

            var allRoles = await context.Roles.ToListAsync();

            foreach (var u in demoUsers)
            {
                var existingUser = await context.Users.FirstOrDefaultAsync(user => user.Email == u.Email);
                var targetRole = allRoles.FirstOrDefault(role => role.Name == u.RoleName);

                if (existingUser == null && targetRole != null)
                {
                    context.Users.Add(new User
                    {
                        Email = u.Email,
                        FullName = u.FullName,
                        PasswordHash = passwordHash,
                        RoleId = targetRole.Id,
                        IsActive = true
                    });
                }
            }

            await context.SaveChangesAsync();

            // Fetch key user references
            var executiveUserObj = await context.Users.FirstOrDefaultAsync(u => u.Email == "executive@lumiere.com");
            var adminUserObj = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@lumiere.com");
            var plannerUserObj = await context.Users.FirstOrDefaultAsync(u => u.Email == "planner@lumiere.com");
            var warehouseUserObj = await context.Users.FirstOrDefaultAsync(u => u.Email == "warehouse@lumiere.com");
            var crewUserObj = await context.Users.FirstOrDefaultAsync(u => u.Email == "crew@lumiere.com");

            var executiveUserId = executiveUserObj?.Id ?? adminUserObj?.Id ?? Guid.NewGuid();
            var plannerUserId = plannerUserObj?.Id ?? executiveUserId;
            var warehouseUserId = warehouseUserObj?.Id ?? executiveUserId;
            var crewUserId = crewUserObj?.Id ?? executiveUserId;

            // 4. Purge old broken seed data ("Fashion Week Runway 2026" / ID 11111111-1111-1111-1111-111111111111 or malformed test events)
            var oldEventIds = new List<Guid>
            {
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Guid.Parse("7644f128-b5ee-4bd7-8fb5-e72d98a916b4")
            };

            var brokenEvents = await context.Events
                .Where(e => oldEventIds.Contains(e.Id) || e.Name == "Fashion Week Runway 2026" || e.Name == "Railway Live Test Gala Launch" || e.IngressDate.Year < 2026)
                .ToListAsync();

            if (brokenEvents.Any())
            {
                var brokenIds = brokenEvents.Select(e => e.Id).ToList();

                var oldTickets = await context.InvestigationTickets.Where(t => t.EventId.HasValue && brokenIds.Contains(t.EventId.Value)).ToListAsync();
                context.InvestigationTickets.RemoveRange(oldTickets);

                var oldDamageReports = await context.DamageReports.Where(d => brokenIds.Contains(d.EventId)).ToListAsync();
                context.DamageReports.RemoveRange(oldDamageReports);

                var oldDispatches = await context.DispatchPreparationQueue.Where(dp => brokenIds.Contains(dp.EventId)).ToListAsync();
                context.DispatchPreparationQueue.RemoveRange(oldDispatches);

                var oldCanvases = await context.EventCanvases.Where(c => brokenIds.Contains(c.EventId)).ToListAsync();
                context.EventCanvases.RemoveRange(oldCanvases);

                var oldReservations = await context.AssetReservations.Where(r => brokenIds.Contains(r.EventId)).ToListAsync();
                context.AssetReservations.RemoveRange(oldReservations);

                context.Events.RemoveRange(brokenEvents);
                await context.SaveChangesAsync();
            }

            // 5. Seed Canonical Assets
            var asset1Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var asset2Id = Guid.Parse("22222222-2222-2222-2222-222222222223");
            var asset3Id = Guid.Parse("22222222-2222-2222-2222-222222222224");

            if (!await context.Assets.AnyAsync(a => a.Id == asset1Id))
            {
                context.Assets.Add(new Asset
                {
                    Id = asset1Id,
                    Name = "Arri SkyPanel S60-C LED Softlight",
                    ItemCallName = "SkyPanel S60-C",
                    Description = "High-output LED soft light with tunable CCT from 2800K to 10000K",
                    AssetState = "Available",
                    BaseCount = 10,
                    Unit = "pcs",
                    Cost = 4500.00m,
                    OriginalValue = 5800.00m,
                    PhotoUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"
                });
            }

            if (!await context.Assets.AnyAsync(a => a.Id == asset2Id))
            {
                context.Assets.Add(new Asset
                {
                    Id = asset2Id,
                    Name = "L-Acoustics K2 Line Array Speaker Module",
                    ItemCallName = "K2 Line Array",
                    Description = "Variable curvature line array element for large scale concert venues",
                    AssetState = "Available",
                    BaseCount = 16,
                    Unit = "pcs",
                    Cost = 8500.00m,
                    OriginalValue = 11000.00m,
                    PhotoUrl = "https://images.unsplash.com/photo-1545454675-3531b543be5d"
                });
            }

            if (!await context.Assets.AnyAsync(a => a.Id == asset3Id))
            {
                context.Assets.Add(new Asset
                {
                    Id = asset3Id,
                    Name = "Custom Modular Velvet Stage Platform 4x8",
                    ItemCallName = "Velvet Deck 4x8",
                    Description = "Heavy duty aluminum frame stage deck with black velvet wrap finish",
                    AssetState = "Available",
                    BaseCount = 20,
                    Unit = "pcs",
                    Cost = 1200.00m,
                    OriginalValue = 1800.00m
                });
            }

            await context.SaveChangesAsync();

            // 6. Seed 10 Clean, Fully Populated Events (September & October 2026)
            var newEvents = new List<Event>
            {
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    Name = "Aura Luxe Autumn Gala 2026",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-09-20T18:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-19T08:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(8),
                    FullStop = new TimeSpan(23, 30, 0),
                    EventVenue = "The Grand Ballroom, Shangri-La Fort",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-18T08:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-21T12:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "Opulent, Gold & Emerald, Crystal Chandelier Focal",
                    ColorPalette = "#004B23, #D4AF37, #1A1A1A, #FFFFFF",
                    BrandingAndTextures = "Brushed Brass, Heavy Emerald Velvet, Mirror Flooring",
                    Notes = "VIP Annual Charity Gala. High-density lighting rig required on main stage.",
                    EstimatedRevenue = 125000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-01T10:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-01T10:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                    Name = "Vanguard Tech Keynote & Product Launch",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-09-28T10:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-27T06:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(6),
                    FullStop = TimeSpan.FromHours(18),
                    EventVenue = "SMX Convention Center Hall 3, Pasay",
                    GeoClass = "National",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-25T06:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-29T18:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 3,
                    EventPegs = "Cyberpunk Industrial, Ultra-Clean LED Curved Wall",
                    ColorPalette = "#0A0E17, #00E5FF, #7C4DFF, #F5F7FA",
                    BrandingAndTextures = "Matte Black Aluminum, Edge-lit Acrylic, Seamless LED Panel Mesh",
                    Notes = "Press conference and live streaming product launch for flagship mobile device.",
                    EstimatedRevenue = 180000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-02T11:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-02T11:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                    Name = "Celestial Horizon Presidential Wedding",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-08T15:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-07T07:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(7),
                    FullStop = new TimeSpan(2, 0, 0),
                    EventVenue = "Solaire Resort Grand Pavilion, ParaÃ±aque",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-06T07:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-09T14:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "Whimsical Floral Canopy, Soft Amber Glow, Romantic Drapery",
                    ColorPalette = "#FFF8F0, #E6C280, #D8A47F, #4A3B32",
                    BrandingAndTextures = "Silk Sheer Fabric, Warm Fairy Lights, Polished Italian Marble",
                    Notes = "500-guest luxury wedding reception. Acoustic isolation requirements.",
                    EstimatedRevenue = 95000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-03T09:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-03T09:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000004"),
                    Name = "Solstice Motors Electric SUV Reveal",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-09-16T19:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-15T09:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(9),
                    FullStop = TimeSpan.FromHours(22),
                    EventVenue = "Okada Manila Glass Dome Auditorium",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-14T09:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-17T12:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "Futuristic Electric Neon, Glass Reflection & Fog Reveal",
                    ColorPalette = "#050B14, #00FF87, #60EFFF, #FFFFFF",
                    BrandingAndTextures = "Tempered Glass, Chrome Accents, Laser Light Tracing",
                    Notes = "Automotive reveal event requiring heavy duty turntable stage integration.",
                    EstimatedRevenue = 210000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-04T14:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-04T14:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000005"),
                    Name = "Apex Global Financial Leaders Summit",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-09-24T08:30:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-23T12:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(12),
                    FullStop = TimeSpan.FromHours(17),
                    EventVenue = "Marriott Grand Ballroom, Pasay",
                    GeoClass = "National",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-21T12:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-09-26T12:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 3,
                    EventPegs = "Corporate Elegance, Minimalist Blue & Platinum, Dual Projection",
                    ColorPalette = "#0F2027, #203A43, #2C5364, #E0E0E0",
                    BrandingAndTextures = "Satin Nickel Trim, High-Gain Matte Screen Fabric, Dark Teak Wood",
                    Notes = "High-profile international banking conference with synchronized interpretation booths.",
                    EstimatedRevenue = 140000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-05T08:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-05T08:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000006"),
                    Name = "Haute Couture Resort Collection Showcase",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-03T19:30:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-02T10:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(10),
                    FullStop = new TimeSpan(22, 30, 0),
                    EventVenue = "City of Dreams NÃ¼wa Ballroom, ParaÃ±aque",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-01T10:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-04T12:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "High Fashion Runway, Stark White T-Stage, Spot-Focused Track Lighting",
                    ColorPalette = "#111111, #FFFFFF, #E5A93C, #888888",
                    BrandingAndTextures = "High-Gloss White Vinyl Runway, Translucent Acrylic Walls",
                    Notes = "Exclusive designer fashion presentation featuring a 30-meter catwalk.",
                    EstimatedRevenue = 88000.00m,
                    IsLossMaker = false,
                    Status = "Planning",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-06T15:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-06T15:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000007"),
                    Name = "Luminary Sustainability & Innovation Awards",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-14T17:30:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-13T08:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(8),
                    FullStop = TimeSpan.FromHours(23),
                    EventVenue = "BGC Amphitheater Outdoor Arena, Taguig",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-12T08:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-15T16:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "Eco-Luxe Biophilic Design, Living Foliage Wall, Ambient Warm LEDs",
                    ColorPalette = "#1B4332, #2D6A4F, #52B788, #D8F3DC",
                    BrandingAndTextures = "Reclaimed Timber Trussing, Natural Moss Panels, Energy-Efficient Rigging",
                    Notes = "Outdoor evening gala celebration. Zero-waste production requirements.",
                    EstimatedRevenue = 105000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-07T13:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-07T13:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000008"),
                    Name = "Horizon Gaming & Esports Championship Final",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-20T11:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-18T06:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(6),
                    FullStop = TimeSpan.FromHours(21),
                    EventVenue = "Mall of Asia Arena Main Stage, Pasay",
                    GeoClass = "National",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-16T06:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-22T18:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 3,
                    EventPegs = "High-Octane RGB Stadium Arena, Dual Player Pods, Smoke & Pyros",
                    ColorPalette = "#000000, #FF0055, #00FFCC, #FFE600",
                    BrandingAndTextures = "Perforated Mesh Metal, Dynamic LED Strip Arrays, Soundproof Glass Pods",
                    Notes = "15,000 live audience eSports tournament. Sub-millisecond latency AV sync.",
                    EstimatedRevenue = 250000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-08T16:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-08T16:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000009"),
                    Name = "Empress Fine Jewelry Private Exhibition",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-25T14:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-24T10:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(10),
                    FullStop = TimeSpan.FromHours(20),
                    EventVenue = "The Peninsula Manila Conservatory",
                    GeoClass = "Local",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-23T10:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-26T12:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 1,
                    EventPegs = "Ultra-High CRI Spotlighting, Velvet Display Pedestals, Armed Security Perimeter",
                    ColorPalette = "#121212, #C5A059, #8C1C1C, #F4F4F4",
                    BrandingAndTextures = "Burgundy Silk Backdrop, Museum-Grade Anti-Reflective Glass Cases",
                    Notes = "Private VIP diamond exhibition. Specialized 98+ CRI museum lighting demanded.",
                    EstimatedRevenue = 75000.00m,
                    IsLossMaker = false,
                    Status = "Active",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-09T10:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-09T10:00:00Z"), DateTimeKind.Utc)
                },
                new Event
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000010"),
                    Name = "AeroSpace Defense Systems Expo 2026",
                    DateOfEvent = DateTime.SpecifyKind(DateTime.Parse("2026-10-29T09:00:00Z"), DateTimeKind.Utc),
                    IngressDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-27T07:00:00Z"), DateTimeKind.Utc),
                    IngressTime = TimeSpan.FromHours(7),
                    FullStop = new TimeSpan(17, 30, 0),
                    EventVenue = "World Trade Center Metro Manila Hall A",
                    GeoClass = "National",
                    MobilizationDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-25T07:00:00Z"), DateTimeKind.Utc),
                    ReturnDate = DateTime.SpecifyKind(DateTime.Parse("2026-10-31T18:00:00Z"), DateTimeKind.Utc),
                    TransitBufferDays = 3,
                    EventPegs = "Tactical Minimalist, Steel Heavy Rigging, High-Payload Trussing",
                    ColorPalette = "#1C2321, #7D8570, #A9927D, #F2F4F3",
                    BrandingAndTextures = "Industrial Diamond-Plate Flooring, Heavy Duty Steel Truss",
                    Notes = "Defense contractor trade show with full scale mockups.",
                    EstimatedRevenue = 195000.00m,
                    IsLossMaker = false,
                    Status = "Completed",
                    CreatedBy = executiveUserId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-10T08:00:00Z"), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-10T08:00:00Z"), DateTimeKind.Utc)
                }
            };

            foreach (var ev in newEvents)
            {
                var existing = await context.Events.FindAsync(ev.Id);
                if (existing == null)
                {
                    context.Events.Add(ev);
                }
                else
                {
                    existing.Name = ev.Name;
                    existing.DateOfEvent = ev.DateOfEvent;
                    existing.IngressDate = ev.IngressDate;
                    existing.IngressTime = ev.IngressTime;
                    existing.FullStop = ev.FullStop;
                    existing.EventVenue = ev.EventVenue;
                    existing.GeoClass = ev.GeoClass;
                    existing.MobilizationDate = ev.MobilizationDate;
                    existing.ReturnDate = ev.ReturnDate;
                    existing.TransitBufferDays = ev.TransitBufferDays;
                    existing.EventPegs = ev.EventPegs;
                    existing.ColorPalette = ev.ColorPalette;
                    existing.BrandingAndTextures = ev.BrandingAndTextures;
                    existing.Notes = ev.Notes;
                    existing.EstimatedRevenue = ev.EstimatedRevenue;
                    existing.IsLossMaker = ev.IsLossMaker;
                    existing.Status = ev.Status;
                    existing.CreatedBy = ev.CreatedBy;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync();

            // 7. Seed Cross-Linked Portal Lifecycle Entries for Events 1, 2, and 3

            // Event 1 Cross-Links
            var event1Id = Guid.Parse("10000000-0000-0000-0000-000000000001");
            var canvas1Id = Guid.Parse("55555555-5555-5555-5555-555555555501");

            var existingCanvas1 = await context.EventCanvases.FirstOrDefaultAsync(c => c.EventId == event1Id);
            if (existingCanvas1 == null)
            {
                context.EventCanvases.Add(new EventCanvas
                {
                    Id = canvas1Id,
                    EventId = event1Id,
                    CanvasMode = "Konva",
                    CanvasStatus = "Approved",
                    CanvasState = "{\"version\":1,\"objects\":[{\"type\":\"stage\",\"x\":100,\"y\":100,\"label\":\"Main Stage Rig\"}]}",
                    AnnotationState = "{\"annotations\":[{\"text\":\"VIP Table Perimeter Clearance\",\"x\":150,\"y\":150}]}",
                    PdfUrl = "https://lumiere.com/blueprints/aura-luxe-gala-v1.pdf",
                    SubmittedBy = plannerUserId,
                    SubmittedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-18T10:00:00Z"), DateTimeKind.Utc),
                    ApprovedBy = plannerUserId,
                    ApprovedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-18T14:00:00Z"), DateTimeKind.Utc)
                });
            }

            if (!await context.AssetReservations.AnyAsync(r => r.EventId == event1Id && r.AssetId == asset1Id))
            {
                context.AssetReservations.Add(new AssetReservation
                {
                    EventId = event1Id,
                    AssetId = asset1Id,
                    LockStart = DateTimeOffset.Parse("2026-09-18T00:00:00Z"),
                    LockEnd = DateTimeOffset.Parse("2026-09-22T00:00:00Z"),
                    IsProvisional = false,
                    ReservedBy = plannerUserId,
                    ReservedAt = DateTimeOffset.Parse("2026-09-18T10:00:00Z"),
                    Status = "Committed"
                });
            }

            if (!await context.DispatchPreparationQueue.AnyAsync(dp => dp.EventId == event1Id && dp.AssetId == asset1Id))
            {
                context.DispatchPreparationQueue.Add(new DispatchPreparationQueue
                {
                    EventId = event1Id,
                    CanvasId = canvas1Id,
                    AssetId = asset1Id,
                    QuantityRequired = 4,
                    PrepStatus = "Prepared",
                    AssignedTo = warehouseUserId,
                    PrepNotes = "Flight cases labeled for Shangri-La Fort Ingress",
                    UpdatedBy = warehouseUserId,
                    CreatedAt = DateTimeOffset.Parse("2026-09-18T11:00:00Z"),
                    UpdatedAt = DateTimeOffset.Parse("2026-09-19T07:00:00Z")
                });
            }

            var demoReportId1 = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var existingReport1 = await context.DamageReports.FindAsync(demoReportId1);
            if (existingReport1 == null)
            {
                context.DamageReports.Add(new DamageReport
                {
                    Id = demoReportId1,
                    EventId = event1Id,
                    AssetId = asset1Id,
                    ReportStatus = DamageVerdict.PendingVerdict,
                    DamagedQuantity = 1,
                    PhotoUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
                    Severity = "Medium",
                    SubmittedBy = crewUserId,
                    SubmittedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-19T14:00:00Z"), DateTimeKind.Utc),
                    IsTemporallyValid = true,
                    NoPhotographicEvidence = false
                });
            }

            // Event 2 Cross-Links
            var event2Id = Guid.Parse("10000000-0000-0000-0000-000000000002");
            var canvas2Id = Guid.Parse("55555555-5555-5555-5555-555555555502");

            var existingCanvas2 = await context.EventCanvases.FirstOrDefaultAsync(c => c.EventId == event2Id);
            if (existingCanvas2 == null)
            {
                context.EventCanvases.Add(new EventCanvas
                {
                    Id = canvas2Id,
                    EventId = event2Id,
                    CanvasMode = "Konva",
                    CanvasStatus = "Draft",
                    CanvasState = "{\"version\":1,\"objects\":[{\"type\":\"curved_led_wall\",\"radius\":500}]}",
                    AnnotationState = "{\"annotations\":[]}",
                    SubmittedBy = plannerUserId,
                    SubmittedAt = DateTime.SpecifyKind(DateTime.Parse("2026-09-26T09:00:00Z"), DateTimeKind.Utc)
                });
            }

            if (!await context.AssetReservations.AnyAsync(r => r.EventId == event2Id && r.AssetId == asset1Id))
            {
                context.AssetReservations.Add(new AssetReservation
                {
                    EventId = event2Id,
                    AssetId = asset1Id,
                    LockStart = DateTimeOffset.Parse("2026-09-25T00:00:00Z"),
                    LockEnd = DateTimeOffset.Parse("2026-09-30T00:00:00Z"),
                    IsProvisional = false,
                    ReservedBy = plannerUserId,
                    ReservedAt = DateTimeOffset.Parse("2026-09-26T09:00:00Z"),
                    Status = "Committed"
                });
            }

            if (!await context.DispatchPreparationQueue.AnyAsync(dp => dp.EventId == event2Id && dp.AssetId == asset1Id))
            {
                context.DispatchPreparationQueue.Add(new DispatchPreparationQueue
                {
                    EventId = event2Id,
                    CanvasId = canvas2Id,
                    AssetId = asset1Id,
                    QuantityRequired = 8,
                    PrepStatus = "In Progress",
                    AssignedTo = warehouseUserId,
                    PrepNotes = "Testing LED DMX controllers",
                    UpdatedBy = warehouseUserId,
                    CreatedAt = DateTimeOffset.Parse("2026-09-26T10:00:00Z"),
                    UpdatedAt = DateTimeOffset.Parse("2026-09-26T14:00:00Z")
                });
            }

            // Event 3 Cross-Links
            var event3Id = Guid.Parse("10000000-0000-0000-0000-000000000003");
            var canvas3Id = Guid.Parse("55555555-5555-5555-5555-555555555503");

            var existingCanvas3 = await context.EventCanvases.FirstOrDefaultAsync(c => c.EventId == event3Id);
            if (existingCanvas3 == null)
            {
                context.EventCanvases.Add(new EventCanvas
                {
                    Id = canvas3Id,
                    EventId = event3Id,
                    CanvasMode = "PDF",
                    CanvasStatus = "Approved",
                    PdfUrl = "https://lumiere.com/blueprints/celestial-wedding-floorplan.pdf",
                    SubmittedBy = plannerUserId,
                    SubmittedAt = DateTime.SpecifyKind(DateTime.Parse("2026-10-05T11:00:00Z"), DateTimeKind.Utc),
                    ApprovedBy = plannerUserId,
                    ApprovedAt = DateTime.SpecifyKind(DateTime.Parse("2026-10-06T09:00:00Z"), DateTimeKind.Utc)
                });
            }

            if (!await context.AssetReservations.AnyAsync(r => r.EventId == event3Id && r.AssetId == asset2Id))
            {
                context.AssetReservations.Add(new AssetReservation
                {
                    EventId = event3Id,
                    AssetId = asset2Id,
                    LockStart = DateTimeOffset.Parse("2026-10-06T00:00:00Z"),
                    LockEnd = DateTimeOffset.Parse("2026-10-10T00:00:00Z"),
                    IsProvisional = false,
                    ReservedBy = plannerUserId,
                    ReservedAt = DateTimeOffset.Parse("2026-10-05T11:00:00Z"),
                    Status = "Committed"
                });
            }

            if (!await context.DispatchPreparationQueue.AnyAsync(dp => dp.EventId == event3Id && dp.AssetId == asset2Id))
            {
                context.DispatchPreparationQueue.Add(new DispatchPreparationQueue
                {
                    EventId = event3Id,
                    CanvasId = canvas3Id,
                    AssetId = asset2Id,
                    QuantityRequired = 6,
                    PrepStatus = "Pending Pull",
                    AssignedTo = warehouseUserId,
                    PrepNotes = "Awaiting rigging cable verification",
                    UpdatedBy = warehouseUserId,
                    CreatedAt = DateTimeOffset.Parse("2026-10-05T12:00:00Z"),
                    UpdatedAt = DateTimeOffset.Parse("2026-10-05T12:00:00Z")
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
