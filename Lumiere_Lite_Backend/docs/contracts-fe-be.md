# Frontend and backend field contracts

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13

Static cross-check of SPA TypeScript shapes against ASP.NET DTOs. JSON is camelCase in `Program.cs`. Case is not the defect. The defect is different words, different ids, and different state machines.

Compatible means a payload the SPA sends or reads would bind to the DTO without a translator. Live call means `fetch` to `Lumiere.API` exists in the SPA.

## 1. Live wires

| Domain | FE type / file | BE type / file | Live call | Compatible | Logic note |
|--------|----------------|----------------|-----------|------------|------------|
| Auth login body | `{ email, password }` in `Lumiere-UI/src/lib/auth.tsx` | `LoginRequest` in `Lumiere.Core/DTOs/LoginRequest.cs` | yes `POST /api/auth/login` | yes | No `[Required]` on the DTO. Empty strings bind. |
| Auth login response | `{ token, fullName, email, userId, role }` then `PortalAccount` | `AuthResponse` | yes | yes, then remapped | `mapBackendUserToPortalAccount` turns `Warehouse Operations Manager` into UI role `Warehouse Manager` plus `fullWarehouseAccess`. Shells then ignore JWT `role_name`. |
| Auth claims | not stored as claims | `JwtService` emits `sub`, `jti`, `email`, `role_id`, `role_name` | yes | partial | `[RequireRole]` reads `role_name` and `ClaimTypes.Role`. Hierarchy is `SystemAdmin`, `Supervisor`, `WarehouseSupervisor`, `FrontOfficePlanner`. Seeded names differ. Admin does not inherit dispatch. `AssetController` create reads claim type `"roles"`, which is not emitted. |
| Damage GET | `DamageException` via `mapBackendDtoToDamageException` in `damageApi.ts` | `DamageReportResponse` | yes `GET /api/damage-reports/event/{id}` | translator | `DamageReportResponse` expanded with `assetName` and `eventName`. `firstSignOff` / `secondSignOff` are JSON strings. |
| Damage POST | `Partial<DamageException>` (`boundEvent`, `imageUrl`, `assetName`, `status`, `logId`) | `CreateDamageReportRequest` (`assetId`, `eventId`, `photoUrl`, `sha256Hash`, `damagedQuantity`) | yes `POST /api/damage-reports` | yes (aliased) | Property aliases added to DTO: `boundEvent` -> `EventId`, `imageUrl` -> `PhotoUrl`. |
| Damage sign-off | `{ verdict, note, pin, justification, repairCostEstimate }` | `DamageSignOffRequest` | yes | yes for those keys | Extra UI fields (`initiatorRole`, `staffEmail`, `selfValidation` object) are dropped except pin and justification. |
| Damage unblock | `{ reason, unblockScope, permanentAcknowledged }` | `AdminEmergencyUnblockRequest` | yes | yes for those keys | UI always sends `unblockScope: instance`. |
| Settlement-blocked GET | `{ blocked, blockingItemsCount }` in `checkSettlementBlockedBackend` | `{ eventId, isSettlementBlocked, blocked }` from `DamageReportController` | yes | yes | Response aligns both `isSettlementBlocked` and `blocked` keys. |

## 2. Not wired

| Domain | FE type / file | BE type / file | Live call | Compatible | Logic note |
|--------|----------------|----------------|-----------|------------|------------|
| Create Event | `NewEventDraft` in `Lumiere-UI/src/lib/types.ts` | `CreateEventRequest` | no | yes (aligned) | See §3. Executive role authorized (`[RequireRole("Executive")]`). `ReturnDate` defaults to `DateOfEvent` if omitted. |
| Event list | `PortalEvent` | `EventResponse` | no | yes (expanded) | API returns expanded DTO: `id`, `name`, `dateOfEvent`, `ingressDate`, `returnDate`, `venue`, `geoClass`, `status`, `isLossMaker`, `createdBy`, `createdAt`. |
| Assets | `AssetStatus` / `CatalogAsset` in `warehouse-catalog.ts`; `StockStatus` / `InventoryItem` in `types.ts` | `Asset` / `AssetResponse` | no | no | API lifecycle vs UI stock-health mix. DTO `quantity` maps to entity `BaseCount`. UI uses `stock`, `capacity`, `threshold`. |
| Reservations | local `AllocatedAsset[]`, `localStorage` `lumiere-canvas-assets-${card.id}` | `BulkReservationRequest` | no | no | API wants Guid `eventId`, Guid `assetIds`, `DateTimeOffset` locks. Planner ids are `pe-*`. |
| Dispatch | `DispatchBatchStatus` in `types.ts`; `warehouse-dispatch.ts` | `PackingListResponse`, `VerifyItemRequest` | no | no | UI statuses `Planned`, `Loaded`, `In Transit`, `Delivered`. API `currentState` is asset lifecycle. Role `Warehouse Operations Manager` only. |
| Deficit | `DeficitLine` in `warehouse-replenishment.ts`; `DeficitStatus` in `types.ts` | `CreateDeficitRequest` / `DeficitResponse` | no | status strings yes, ids no | Status `Not Purchased`, `In Procurement`, `Received` match. PATCH also accepts `Resolved`, which the UI union lacks. Ids `def-${event.id}-n` vs Guid. |
| Vendors | `Vendor` in `types.ts` | `VendorResponse` | no | no | FE has contact, rating, `priceTier`. API has `name`, `address`, representatives split from `RepresentativeName`. |
| Manning | `manning.ts` / browser `manning_assignments` | none | no | n/a | No roster controller. |
| Ground crew events | hardcoded `EventItem` on `GroundCrewPage` | `EventResponse` | no | no | Crew page does not `GET /api/events`. Declarations stay in memory. |

## 3. Create Event field pairs

| FE (`NewEventDraft` / `PortalEvent`) | BE (`CreateEventRequest` / `Event`) | Fit |
|--------------------------------------|-------------------------------------|-----|
| `title` | required `eventName` → entity `Name` | rename |
| `venue` | required `eventVenue` | rename |
| `targetDate` display string | required `dateOfEvent` `DateTime` | type |
| `installationStart` / `installationEnd` time strings | required `ingressDate` + `ingressTime` + `fullStop` | different shape |
| `client` | none | FE only |
| `moodPlan` | none (optional `eventPegs`, `colorPalette`, `brandingAndTextures`, `notes`) | FE only |
| none | required `geoClass` `Local` \| `National` | BE only. Sets `TransitBufferDays` 1 or 3. Reservations then pad National 3/5 and Local 1/1. |
| none | `returnDate` | BE only. Must be on or after `dateOfEvent`. |
| `id` `e-${Date.now()}` | `Guid` | different id space |
| status `Initialized` … `Settled` | `Active` (create). Update is a free string. | different machine |
| `tier` `ExperienceTier` | none | FE only |
| `budget` | optional `estimatedRevenue` (≤0 sets `isLossMaker`) | not mapped |

## 4. Asset and dispatch states

API `Asset.AssetState` (string, no C# enum): `Available`, `Committed`, `Prepping`, `In-Transit Outbound`, `On-Site`, `In-Transit Return`, `Pending Count`, `Available Unprepped`, `Lost In Action`, plus damage writes `In Maintenance` and `Depleted`.

UI catalog `AssetStatus`: `Available`, `Low Stock`, `Critical Deficit`, `Deployed`, `Lost In Action`, `In Maintenance`.

UI dispatch `DispatchBatchStatus`: `Planned`, `Loaded`, `In Transit`, `Stalled In Transit`, `Delivered`, `Returned`.

`AssetService.TransitionStateAsync` forbids `Prepping` → `In-Transit Outbound`. `DispatchService.IsValidTransition` allows it. Create-asset service roles are `WarehouseSupervisor`, `ProductionSupervisor`, `ReplenishmentHub`, `PurchasingOfficer`, `SystemAdmin`. Seeded names differ (`Purchasing Officer` has a space).

Internal DTO renames with no SPA caller: `Quantity`↔`BaseCount`, `CatalogPhotoUrl`↔`PhotoUrl`, `HexCode`↔`HexValue`, `TagName`↔`TagValue`. Dispatch queue entity default `Pending Pull`. Runtime uses `Prepping` then `Dispatched`.

## 5. Damage verdicts

Verdict strings match on both sides: `Pending Verdict`, `Validated`, `Dismissed`, `Held for Audit`, `Pending Second Sign-off`, `Repair`, `Write-off`. Settlement blockers match the drawer.

Create keys do not match. GET is a demo-GUID translator. Settlement GET keys do not match.

## 6. Identity extras

Seeded roles (13 names, comment says 14): Admin, Executive, Event Planner, Warehouse Operations Manager, Warehouse Manager, Inventory Officer, Manning Officer, Production Manager, Purchasing Officer, Warehouse Lead, Warehouse Member, Ground Crew, Event Admin. `SystemAdmin` is not seeded.

UI `STAFF_ROLES` includes `Field & Production Crew`, which is not seeded.

Password change writes browser Supabase `portal_accounts`. Second identity store.

Auth error objects use `{ error }`. `login-debug` is anonymous.

Canvas grant bypass roles `Supervisor` and `SystemAdmin` are not seeded. Only the event creator can grant access for seeded users.
