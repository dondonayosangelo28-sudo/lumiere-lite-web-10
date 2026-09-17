# Assets and inventory

**Project:** Lumiere
**Domain:** assets-inventory
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F6, PRD-F10, PRD-F14

## Purpose

The warehouse catalog is the stock ledger: identity, photos, tags, colors, and a state machine from Available through on-site and return.

## As-built

- API: `AssetController`, `AssetImportController` (CSV cap 75), colors/tags, salvage, `AssetService.TransitionStateAsync`.
- Create is gated in the service on role strings `WarehouseSupervisor` / `ProductionSupervisor` / `ReplenishmentHub` / `PurchasingOfficer` / `SystemAdmin`, which are not the seeded WOM set. Combined with claim type `"roles"`, create is likely always unauthorized.
- `BackgroundRemovalService` sleeps 100ms and returns the same stream. Target is a real vendor behind the same interface (`rfc-lumiere-bg-removal.md`). The SPA chroma-key is not this path.
- Photos are intended for Supabase Storage bucket `assets`.
- UI catalog (`warehouse-catalog.ts`, `store.tsx` seeds, `inventory-ops.tsx` localStorage) is not this table.
- Lost-in-action: `LostInActionAuditWorker` hourly.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `AssetStatus` (`Available`, `Low Stock`, `Critical Deficit`, `Deployed`, `Lost In Action`, `In Maintenance`) | `Asset.AssetState` (`Available`, `Committed`, `Prepping`, `In-Transit Outbound`, `On-Site`, `In-Transit Return`, `Pending Count`, `Available Unprepped`, `Lost In Action`, plus `In Maintenance` / `Depleted` from damage) | no | no |
| `stock` / `capacity` / `threshold` | DTO `quantity` → entity `BaseCount` | no | rename, unused |
| catalog seed | `AssetResponse` | no | different table |

`AssetService` forbids `Prepping` → `In-Transit Outbound`. `DispatchService` allows it. Create-asset roles (`WarehouseSupervisor`, `PurchasingOfficer`) are not the seeded names.

## Production SHALL

1. Catalog screens SHALL read and write `/api/assets`.
2. Create SHALL authorize on seeded WOM / Purchasing / Admin names and JWT `role_name`.
3. Transitions SHALL use one matrix. Dispatch and AssetService SHALL not disagree on Prepping → In-Transit Outbound.
4. Bulk import SHALL stay capped and SHALL store photos only after a real storage upload. Catalog ingest SHALL call `IBackgroundRemovalService`. Production SHALL NOT register the mock. On vendor failure, store the original and do not claim a cutout.
5. Production SHALL NOT treat InMemory EF as inventory truth.

## Scenarios

**Create as WOM**
- GIVEN JWT `role_name` = `Warehouse Operations Manager`
- WHEN POST `/api/assets` with a valid body
- THEN 201 and the asset lists in GET filters

**Unauthorized create**
- GIVEN Ground Crew JWT
- WHEN POST `/api/assets`
- THEN 403
