# Scrutiny Gate

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Draft
**Last reconciled:** 2026-09-12
**Verdict:** PROCEED WITH FIXES

This file stress-tests the Idea Brief against live code. It does not depend on other docs. Claims below are from `Lumiere` and `Lumiere-UI` as of 2026-09-12.

## 1. Verdict

Proceed to Specify. Do not call the current checkout a shipped platform.

The five account shells exist. The ASP.NET API has real event, asset, reservation, dispatch, and damage services. The product loop does not close: Create Event is React state, login is `http://localhost:8080`, and identity/data are split across EF, browser Supabase, in-memory stores, and a Neon serverless route.

## 2. Claims vs code

| Idea claim | Code | Result |
|------------|------|--------|
| One event record downstream | `RegisterEventDrawer` → `store.tsx` `addEvent()`. No `POST /api/events`. API create is `[RequireRole("Admin")]`. | Gap |
| Canvas allocations prevent double-booking | Konva workspace holds local `AllocatedAsset[]`. `ReservationService` overlap logic is unused by the canvas. | Gap |
| Warehouse inventory is stock truth | Catalog and replenishment UIs seed or derive rows. `AssetService` is a different model. | Gap |
| Ground crew offline-first PWA | `portal: 'pwa'` is a mobile layout. No Web App Manifest, no service worker. | Gap |
| JWT auth | `POST /api/auth/login` works against EF users when the API is local. Vercel HTTPS pages mixed-content-block localhost. | Partial |
| Dispatch | `DispatchController` prepare/verify/force exist. WOM UI uses a separate in-memory map. | Partial |
| Catalog cutout is a real model | `BackgroundRemovalService` passthrough. SPA chroma-key in `AddAssetModal.tsx`. | Gap |

## 3. Feasibility

The north star (Vercel + Railway Docker + one Supabase Postgres) matches what the API already almost is: Kestrel on `PORT`, Dockerfile publish of `Lumiere.API`, Npgsql, Supabase Realtime/Storage clients. The work is wiring and deleting extra stores, not inventing a backend.

## 4. Risks

- Silent `UseInMemoryDatabase` when Postgres is down (`Program.cs`). Production can look healthy and lose data on restart.
- JWT secret committed in `Lumiere.API/appsettings.json`.
- Anonymous `POST /api/auth/login-debug` returns stack traces.
- Role string drift: RBAC hierarchy names (`SystemAdmin`, `Supervisor`) vs seeded names (`Admin`, `Event Planner`, `Warehouse Operations Manager`). Asset create reads claim type `"roles"`; JWT emits `role_name`.
- Two asset state machines (`AssetService` vs `DispatchService`) disagree on Prepping → In-Transit Outbound.

## 5. Fixes required before calling Specify done

1. One API base URL via environment. CORS matches the real Vercel origin.
2. Create Event writes `POST /api/events` and is authorized for the persona the product actually uses (Executive in the UI today).
3. Production refuses InMemory. Secrets out of git. Remove or lock down `login-debug`.
4. Replace mock `BackgroundRemovalService`. Do not ship the SPA chroma-key as the model.

Critical IDEA lock-bar fields are filled. Concept visuals are missing, so IDEA stays Draft. That is not a stop on writing PRD/SDD as Draft.
