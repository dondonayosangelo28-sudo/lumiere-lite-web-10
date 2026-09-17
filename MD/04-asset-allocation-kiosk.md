# Asset allocation kiosk

**Project:** Lumiere
**Domain:** asset-allocation-kiosk
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-17
**PRD links:** TBD — confirm PRD ID with PM

## Purpose

Executive browses assets by classification in a two-pane kiosk (20% sidebar of
categories, thumbnail-only grid), picks a quantity, and chooses procure vs. crossdock.
Source notes cut off before defining what happens after that choice.

## As-built

- No page or component with this layout exists anywhere in `src/pages/` or
  `src/components/` — confirmed by directory listing, not just a guess. No 20%-width
  collapsible sidebar, no logo-toggle, no thumbnail-only classification list, no 4×3
  category grid.
- Closest FE analog: `AllocationModals.tsx` (`ConfigureAllocationModal` →
  `AllocationVerifiedModal` / `InventoryDeficitModal`), used from
  `DesignCanvasHubPage.tsx` / `CanvasWorkspacePage.tsx`. This is a quantity-vs-stock check
  embedded in the drag-and-drop mood-board tool, entirely client-side against
  `usePortal().inventory` — no procure/crossdock choice, no kiosk layout.
- Second FE analog: `InventoryStockPage.tsx` — a warehouse-manager CRUD grid (search,
  category filter, sort, add/edit, maintenance workflow) over `InventoryItem`
  (`src/lib/types.ts`: `id`, `assetId` (string), `category` (string), `stock`,
  `capacity`, `status`, plus display metadata). Every card shows full metadata, not
  thumbnail-only, and it's a management console, not a browsing kiosk.
- Real backend asset model is structurally different from both FE models above:
  `AssetController.cs` (`GET/POST /api/assets`) works against `AssetSubTypeId` (Guid),
  `AssetTier` (int 1–5), `AssetState` (string, via `POST /{id}/transition`), `Colors`
  (list of hex + paint brand), `Tags` (list of strings) — see `AssetDTOs.cs`. `GetAssets`
  already supports `assetTypeId`, `tagValue`, `hexValue`, `tier`, `state` query params,
  which map fairly well onto "browse by classification" and "thematic search," but
  nothing on the FE calls this endpoint with those params today.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `InventoryItem.category` (free string) | `AssetSubTypeId` (Guid, presumably FK to an asset-type table) | no | **no** — different modeling entirely (string label vs. relational type) |
| `InventoryItem.assetId` (string, e.g. `LM-1234`, client-generated: `` `LM-${Math.floor(1000 + Math.random() * 9000)}` `` in `InventoryStockPage.tsx`) | `AssetResponse.Id` (server-issued Guid) | no | no — FE invents its own IDs client-side instead of using server-issued ones |
| `InventoryItem.stock` / `.capacity` | `AssetResponse.Quantity` (single int, no separate stock/capacity split) | no | partial — BE has one quantity concept, FE has two |
| (no FE search-by-tag/hex UI anywhere) | `GET /api/assets?tagValue=&hexValue=&assetTypeId=&tier=&state=` | no | endpoint ready, unused |
| `ConfigureAllocationModal` quantity check | `TransitionStateRequest` (`POST /api/assets/{id}/transition`, `TargetState`, optional `EventId`, `OverrideFlag`) — closest BE analog to "reserve/allocate" | no | conceptual overlap only; FE never calls this endpoint |
| Procure / crossdock decision (spec, not yet built anywhere) | "Procure" side: `POST /api/deficit-queue` (`CreateDeficitRequest`) → `GET /api/deficit-queue?eventId=&status=` → `PATCH /{id}/status` (`DeficitQueueController.cs`). Vendor side: `POST /api/vendors`, representatives/contacts/platforms sub-routes, `GET /api/vendors` (`VendorController.cs`) | no | plausible fit for "Procure" — flags a deficit, which a WOM/vendor flow then resolves. **"Crossdock" has no obvious matching endpoint in either controller** — needs a follow-up read of `VendorAssetController.cs` and `DispatchDTOs.cs` before confirming |

## Production SHALL

1. This is a net-new FE surface — it SHALL be built against the real `AssetController`
   DTOs (`AssetSubTypeId`, `AssetTier`, `AssetState`, `Colors`, `Tags`) rather than the
   local `InventoryItem` model, to avoid inventing a third asset shape.
2. The left-sidebar "classifications" list SHALL be backed by whatever endpoint/table
   `AssetSubTypeId` resolves against (not yet located in this pass — check
   `Lumiere.Application`/`Lumiere.Infrastructure` for an asset-type listing endpoint
   before building the sidebar data source).
3. The right-pane search SHALL use `GET /api/assets?tagValue=&hexValue=` (already built)
   for the "name or description" thematic-match requirement, rather than a new
   client-side filter, once confirmed that `tagValue` matches against free-text tags in a
   way that covers "description" search too (needs verification — `Tags` in
   `AssetDetailResponse` is a flat string list, not obviously the same as a description
   field).
4. Step 1 (quantity assignment) SHALL either call `POST /api/assets/{id}/transition` with
   an appropriate `TargetState`, or a new endpoint SHALL be confirmed as the correct one —
   this is not yet decided.
5. Step 2, "Procure" branch: on read, `DeficitQueueController.cs` + `VendorController.cs`
   are a plausible fit — "Procure" likely SHALL call `POST /api/deficit-queue` to flag the
   shortfall, which some WOM-side flow (not yet located) then resolves against
   `GET /api/vendors`. This SHALL be confirmed with whoever owns the deficit-queue /
   vendor domain before wiring, not assumed correct from controller names alone.
6. Step 2, "Crossdock" branch: still **BLOCKED**. Neither `DeficitQueueController.cs` nor
   `VendorController.cs` has an obvious crossdock concept. `VendorAssetController.cs` and
   `DispatchDTOs.cs` were not read in this pass and SHALL be checked next before any
   Production SHALL is written for this branch — do not guess at this endpoint.

## Scenarios

**Not yet buildable end-to-end**
- GIVEN the current backend and frontend as audited
- WHEN attempting to implement the full kiosk flow described in the spec
- THEN Step 1 (browse, search, assign quantity) CAN be scoped now against
  `GET /api/assets` and `POST /api/assets/{id}/transition`
- BUT Step 2 (procure vs. crossdock outcome) CANNOT be scoped without first reading
  `DeficitQueueController.cs` and the vendor controllers — flagged as a hard blocker,
  not an open question to resolve during implementation

**Asset ID mismatch (known blocker for any wiring)**
- GIVEN `InventoryStockPage.tsx` currently generates its own `assetId` client-side
- WHEN this kiosk is wired to the real `AssetController`
- THEN any code that still relies on `InventoryItem.assetId` (client-generated) instead of
  `AssetResponse.Id` (server-issued) SHALL be treated as needing migration, not as a
  data source to copy into the new kiosk
