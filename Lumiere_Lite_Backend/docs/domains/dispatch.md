# Dispatch

**Project:** Lumiere
**Domain:** dispatch
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F7

## Purpose

Turn committed reservations into a packing list, prep queue, and outbound/return movement.

## As-built

- API prefix `api/dispatch`. All actions `[RequireRole("Warehouse Operations Manager")]`. Admin does not inherit that name through the broken hierarchy list.
- `PrepareDispatchAsync`: event must be Active; reject if a queue row exists with `PrepStatus != "Dispatched"`; Committed reservations → asset Prepping + `DispatchPreparationQueue` row.
- `VerifyItemAsync`: Prepping → In-Transit Outbound. When none remain Prepping, queue `Dispatched`.
- `ForceDispatchAsync`: remaining Prepping → In-Transit Outbound.
- `GetPackingListAsync`: groups non-cancelled reservations.
- `UpdateAssetStateAtomicAsync` has no controller route.
- Broadcasts are one-way Supabase Realtime `asset-transitions` after commit. Not an inbox.
- UI: `warehouse-dispatch.ts` in-memory map, directions `outbound` | `return`. Optional upsert to `manning_dispatch_batches` (browser Supabase). Not `DispatchController`.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `DispatchBatchStatus` `Planned` \| `Loaded` \| `In Transit` \| `Stalled In Transit` \| `Delivered` \| `Returned` | packing list `currentState` (asset lifecycle) | no | no |
| in-memory batches / `manning_dispatch_batches` | `PackingListResponse`, `VerifyItemRequest` `{ assetId }` | no | no |
| any warehouse shell | `[RequireRole("Warehouse Operations Manager")]` | no | Admin JWT cannot inherit this name |

Queue entity default `Pending Pull`. Runtime `Prepping` then `Dispatched`.

## Production SHALL

1. Warehouse dispatch screens SHALL call `/api/dispatch`.
2. Only WOM (and an explicit Admin override if product wants it) SHALL prepare/verify/force.
3. Outbound and return SHALL be the two directions. Do not invent a third database for batches.
4. Production SHALL fail if Realtime broadcast fails only as a warning after the DB commit succeeded, and SHALL log it. DB commit remains source of truth.

## Scenarios

**Prepare**
- GIVEN Active event, Committed reservations, no open queue
- WHEN POST `/api/dispatch/event/{id}/prepare`
- THEN assets Prepping and packing list non-empty

**Wrong role**
- GIVEN Event Planner JWT
- WHEN prepare
- THEN 403
