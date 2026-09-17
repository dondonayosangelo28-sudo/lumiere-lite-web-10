# WOM account (Inventory, Replenishment, Purchasing)

**Project:** Lumiere
**Domain:** wom-account
**Version:** 0.2
**Status:** In Progress (§1 resolved; §2–§4 blocked pending PM)
**Last reconciled:** 2026-09-17
**PRD links:** TBD — the source notes never detailed this account; no PRD reference exists
to reconcile against yet

## Purpose

Per the account overview, "WOM" covers Inventory, Replenishment, and Purchasing. The
source notes cut off before describing a landing interface, fields, or flows for this
account — unlike Executive, which got a full mockup.

## As-built

- No `StaffRole` value literally named `'WOM'` exists. `src/lib/types.ts` `STAFF_ROLES`
  has: `'Admin'`, `'Executive'`, `'Warehouse Manager'`, `'Event Planner'`,
  `'Ground Crew'`, `'Event Admin'`, `'Warehouse Lead'`, `'Warehouse Member'`,
  `'Field & Production Crew'`. `'Warehouse Manager'` is the closest existing name.
- FE role-check strings elsewhere are inconsistent with this list — `AssetController.cs`
  checks for `"Warehouse Operations Manager"` (not `"Warehouse Manager"`) when gating
  `TransitionState`/`SalvageAsset`, and `DispatchController.cs` uses
  `[RequireRole("Warehouse Operations Manager")]` on every endpoint. **This is a naming
  mismatch between FE `StaffRole` and BE role strings, not just a WOM-specific gap** —
  flag for a full audit, not just in this feature's scope.
- **§1 finding (2026-09-17):** The FE already handles this correctly in
  `src/lib/auth.tsx`:`mapBackendUserToPortalAccount` (line 66).  When the BE issues a
  JWT with `role: "Warehouse Operations Manager"`, that raw role string is normalised
  internally to `role: 'Warehouse Manager'` for FE display/routing, **but the JWT token
  itself is stored and forwarded to the BE unchanged**. This means `AssetController.cs`
  and `DispatchController.cs` will read `"Warehouse Operations Manager"` from the JWT
  claim — which is exactly what their `[RequireRole]` attributes require. The role-gate
  mismatch the MD flagged **does not exist at the FE/BE boundary** in the current auth
  layer. No FE code change is needed for §1. Closing §1 as resolved.
- Frontend pages that plausibly sit under a WOM umbrella already exist and are fairly
  built out: `InventoryStockPage.tsx` (asset registry, grid/list, add/edit, maintenance),
  `ReplenishmentPage.tsx`, `ReorderRequisitionModal.tsx`, plus
  `WarehouseHomePage.tsx` / `WarehouseLeadPage.tsx` / `WarehouseMemberPage.tsx` /
  `WarehouseLogsPage.tsx` / `InventoryOfficerPage.tsx` / `DispatchManifestPage.tsx`.
- Backend has real, matching-in-spirit domains: `AssetController.cs` (inventory),
  `DeficitQueueController.cs` (replenishment/shortage flagging), `VendorController.cs`
  (purchasing/vendor contacts), `DispatchController.cs` (movement). None of the FE pages
  above were confirmed in this pass to actually call these — see
  `03-event-registration.md` and `04-asset-allocation-kiosk.md` for the pattern already
  found elsewhere in this codebase (FE builds a fully local model, BE endpoint exists and
  goes unused). Assume the same pattern here until each page is individually audited.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `InventoryStockPage.tsx` over `InventoryItem` | `AssetController.cs` (`AssetSubTypeId`, `AssetTier`, `AssetState`) | not verified this pass | not verified — see `04-asset-allocation-kiosk.md`'s Wire table, same `InventoryItem` model is implicated there and found unwired |
| `ReplenishmentPage.tsx` / `ReorderRequisitionModal.tsx` over `ProcurementItem`/`ReorderDraft` | `DeficitQueueController.cs` (`CreateDeficitRequest`, `UpdateDeficitStatusRequest`) | not verified this pass | plausible conceptual match, not confirmed |
| Vendor selection UI (referenced by `ReorderDraft.vendorId`, `Vendor` type in `types.ts`) | `VendorController.cs` (`CreateVendorRequest`, representatives/contacts/platforms) | not verified this pass | plausible conceptual match, not confirmed |
| `StaffRole` `'Warehouse Manager'` (FE internal) | Role-gate strings `"Warehouse Operations Manager"` in `AssetController.cs` / `DispatchController.cs` | **resolved** | **yes** — JWT carries BE-issued `"Warehouse Operations Manager"` claim unchanged; FE only normalises the label for display/routing, does not rewrite the token. No mismatch at the API boundary. |

## Production SHALL

1. ~~Before any WOM-specific work starts, the `StaffRole` ↔ backend role-string mismatch
   (`"Warehouse Manager"` vs. `"Warehouse Operations Manager"`) SHALL be resolved —
   this blocks every WOM endpoint call, not just new ones.~~
   **RESOLVED 2026-09-17** — `mapBackendUserToPortalAccount` in `src/lib/auth.tsx`
   stores and forwards the BE-issued JWT intact; the FE normalisation to `'Warehouse Manager'`
   is display-only and does not rewrite the token claim. No FE change needed.

2. PM SHALL confirm whether "WOM" is a new account distinct from the existing
   `'Warehouse Manager'` / `'Warehouse Lead'` / `'Warehouse Member'` roles, or the intended
   umbrella name for them, before a WOM-specific landing interface is designed.
   **BLOCKED — awaiting PM.**

3. `InventoryStockPage.tsx`, `ReplenishmentPage.tsx`, and `ReorderRequisitionModal.tsx`
   SHALL each get their own Wire-table pass (this doc only records a plausible match, not
   a verified one) before claiming "already wired" or "needs wiring" for any of them.
   **BLOCKED — awaiting PM decision on §2 scope first.**

4. No new WOM landing interface SHALL be designed from scratch without first deciding
   whether `WarehouseHomePage.tsx` already serves this purpose (per the design-system
   doc's shell table: *"Warehouse desktop | WOM full access | Module grid
   `WarehouseHomePage`, not a forever-sidebar home"* — if that line is accurate, WOM's
   shell may already exist and just needs its role-gate fixed, not a rebuild).
   **BLOCKED — awaiting PM. Role-gate confirmed not broken (§1 above), so this decision
   is the sole remaining blocker before any WOM scope work starts.**

## Scenarios

**Role-gate mismatch (RESOLVED)**
- GIVEN a user with `StaffRole === 'Warehouse Manager'` in the FE
- WHEN that user's JWT is checked against `AssetController.cs`'s
  `"Warehouse Operations Manager"` string match
- THEN the check passes — the JWT carries the BE-issued `"Warehouse Operations Manager"`
  claim; the FE label normalisation in `mapBackendUserToPortalAccount` is display-only
- AND no FE fix was required; the auth layer was already correct

**Scope undecided (open — awaiting PM)**
- GIVEN the source notes name "WOM" but never describe it
- AND `WarehouseHomePage.tsx` already exists and is referenced as the Warehouse desktop
  shell in the design-system doc
- WHEN scoping this feature
- THEN the first task SHALL be confirming with PM whether WOM = existing Warehouse shell
  (just needs live wiring + role-gate fix) or WOM = a new account needing its own design
  pass — **not yet decided, do not build a new interface pre-emptively**
