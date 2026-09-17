# Product Requirements Document (PRD)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13

This file is the product contract. Gap means the UI or API exists but the production loop does not. You can implement from this file without opening the SDD.

## 1. Product Purpose & Value Proposition

Lumiere is an event resource planning system for a production house that owns warehouse stock and field crews. Executives open events. Planners peg layouts and reserve assets. Warehouse staff pick, prep, and dispatch. Ground crew confirm movement and report damage. One event identifier and one Postgres database are the spine.

## 2. Target Personas

**Primary persona: Maya, Warehouse Operations Manager**
- *Who they are:* Owns inventory, packing lists, replenishment, and who is on the truck.
- *Their core frustration:* Canvas "allocated" and warehouse "available" disagree until load-in.
- *What success looks like:* A packing list that matches committed reservations, with no silent double-book.

**Secondary persona: Ramon, Executive**
- *Who they are:* Opens the event, watches portfolio risk, does not operate the warehouse.
- *Their core frustration:* Creating an event in a dashboard that warehouse never sees.

**Secondary persona: Ground crew lead on site**
- *Who they are:* Phone in a venue with intermittent network.
- *Their core frustration:* Cannot confirm outbound or file damage unless wifi is perfect. (Installable offline is Should-Have after the online path.)

## 3. Core Features & Priorities

| ID | Feature | Description | Priority | As-built 2026-09-12 |
|----|---------|-------------|----------|---------------------|
| PRD-F1 | Staff authentication | Email/password login, JWT, role on the user, logout. One user table. | Must-Have | Partial. API login works locally. SPA hardcodes `http://localhost:8080`. Browser also writes a separate accounts table when Supabase env is set. |
| PRD-F2 | Admin governance | Provision users, assign roles, ephemeral grants, audit of permission changes. | Must-Have | Partial. Admin screens exist. RBAC tree is in-memory. API has ephemeral permission endpoints. |
| PRD-F3 | Create Event | Executive (product) creates event metadata. Record persists and appears to Planner, Warehouse, Crew after reload. | Must-Have | Gap. UI `addEvent()` is memory. Drawer fields (`title`, `venue`, `targetDate`, `installationStart`, `installationEnd`, `client`, `moodPlan`) do not match required API fields (`eventName`, `dateOfEvent`, `ingressDate`, `ingressTime`, `fullStop`, `eventVenue`, `geoClass`). API `POST /api/events` is Admin-only and unused by the drawer. |
| PRD-F4 | Executive visibility | Portfolio dashboard, registry, damage visibility, loss-maker acknowledgement. | Must-Have | Partial. Dashboards are seeded. `AcknowledgeLossMaker` exists on API, unused. |
| PRD-F5 | Planner canvas | Canva-like workspace. Allocations create reservations that block overlapping use (geo buffers). | Must-Have | Partial. Konva workspace exists. Does not call `/api/reservations`. |
| PRD-F6 | Asset catalog | CRUD, colors, tags, bulk import, state machine, photos in Storage. | Must-Have | Partial. API is real. Create likely fails on claim type `"roles"`. UI catalog is a different seed. |
| PRD-F7 | Dispatch | Prepare, verify item, force dispatch, packing list for an active event. WOM-gated. | Must-Have | Partial. API exists. UI dispatch store is separate. |
| PRD-F8 | Damage and deficit | Crew files damage with photo. Dual-custody sign-off. Deficit queue. Settlement block. | Must-Have | Partial. Verdict strings match. Create keys do not (`boundEvent`/`imageUrl` vs `assetId`/`eventId`/`photoUrl`/`sha256Hash`). Settlement GET returns `isSettlementBlocked`; SPA types `blocked`. Crew declarations are in-memory. |
| PRD-F9 | Manning and roster | Crew assignments per event/day without double-booking people. | Should-Have | Gap. Manning Officer role is seeded. No roster API. UI uses presets plus optional unrelated tables. |
| PRD-F10 | Replenishment / vendors | Restock from deficits. Vendor graph. | Should-Have | Partial. API vendors exist. Replenishment UI derives fake deficit lines. |
| PRD-F11 | Ground crew field app | Mobile portal: confirm outbound/return, tasks, damage. Online first. | Must-Have | Partial. Mobile pages exist. Not an installable PWA. Events hardcoded on the crew page. |
| PRD-F12 | Installable offline PWA | Service worker, manifest, replay queue. | Could-Have | Missing. Do after PRD-F11 online path. |
| PRD-F13 | Production quotas / Gantt | Production Manager module. | Could-Have | UI only. |
| PRD-F14 | Catalog background removal | Real cutout of warehouse asset photos on ingest (catalog add and bulk import). API `IBackgroundRemovalService` is the only production path. SPA chroma-key is not the model. | Must-Have | Gap. Mock sleep + passthrough. SPA `AddAssetModal` also runs a client chroma-key. |
| PRD-F15 | Deploy north star | Vercel SPA + Railway Docker API + one Supabase Postgres. `VITE_API_URL`. Secrets not in git. | Must-Have | Gap. Dockerfile exists. SPA already static-hosts. Wire does not. |

## 4. User Stories & Acceptance Criteria

**US-01 Create Event persists**
> As Ramon, I want to register an event so that Maya sees it after refresh.

Acceptance:
- Given a valid JWT for the creating role, when I submit `eventName`, `dateOfEvent`, `ingressDate`, `ingressTime`, `fullStop`, `eventVenue`, and `geoClass` (`Local` or `National`), then `POST /api/events` returns the event id and a reload of Warehouse Home lists that Guid.
- Given overlapping venue+dates, when I submit, then the API returns 409 and no second row.

**US-02 Login from Vercel**
> As Maya, I want to sign in on the hosted SPA so that I reach Warehouse Home.

Acceptance:
- Given `VITE_API_URL` is the Railway HTTPS origin, when I post email and password, then I receive a JWT and the SPA stores it.
- Given a production HTTPS page, when the API URL is http localhost, then login must fail closed (no silent demo user).

**US-03 Reservation conflict**
> As a planner, I want a chair allocation to fail if another active event already holds it in the geo buffer window.

Acceptance:
- Given asset A reserved for event E1 (National, 3/5 day buffers in `ReservationService`), when E2 overlaps, then bulk reserve returns conflict and A stays Committed to E1.

**US-04 Dispatch prepare**
> As Maya, I want prepare-dispatch to move committed assets to Prepping.

Acceptance:
- Given an Active event with Committed reservations and no unfinished queue rows, when I `POST /api/dispatch/event/{id}/prepare`, then assets are Prepping and a packing list is readable.

**US-05 Damage report**
> As crew, I want to file damage with a photo so that settlement can block.

Acceptance:
- Given a live event Guid (same id the warehouse uses), when I `POST /api/damage-reports` with `assetId`, `eventId`, `photoUrl`, and `sha256Hash`, then Admin/Executive validation lists that row, not a demo Guid.

**US-06 Catalog cutout**
> As Maya, I want a catalog photo to store a cutout so the card is the object, not the warehouse wall.

Acceptance:
- Given a valid WOM JWT and an image on catalog add or bulk-import phase 2, when the API calls `IBackgroundRemovalService`, then Storage holds a PNG/WebP with alpha (or the original if the vendor failed), and the asset is not marked cut out unless the vendor succeeded.
- Given the vendor is down, when ingest runs, then the original is stored, the failure is logged, and the API does not claim a cutout.
- Given a damage-report photo, when it is uploaded, then it does not enter this pipeline.

## 5. App Flow & UX Intent

**Navigation (as-built):** in-memory `Route` union in `App.tsx`. No React Router. `portal: 'web' | 'pwa'` is the only hard gate.

**Linear production flow**

1. Login (`LoginPage` or `GroundCrewLoginPage`).
2. Executive registry → create event.
3. Planner canvas hub → workspace → allocate.
4. Warehouse home → catalog / replenishment / dispatch.
5. Ground crew field-ops → confirm movement / damage.
6. Damage validation → settle.

**Target:** same screens, same event GUID everywhere.

## 6. Auth and roles (product)

Structural accounts: Admin, Executive, Event Planner, Warehouse Operations Manager (plus sub-roles), Ground Crew.

Seeded API roles in `DbInitializer` also include Warehouse Manager, Inventory Officer, Manning Officer, Production Manager, Purchasing Officer, Warehouse Lead, Warehouse Member, Event Admin.

Product rule: one role vocabulary in JWT `role_name`, UI map, and `[RequireRole]`. Hierarchy names that are not seeded (`SystemAdmin`, `Supervisor`) SHALL NOT be the only path to a permission.

Create Event owner: Executive creates, Admin updates/deletes (locked decision D7).

## 7. AI Component

**Component:** catalog photo background removal (PRD-F14).

**Intended use:** cut the warehouse or studio backdrop off asset photos so the catalog shows the object. Operators still confirm the saved image.

**Input:** untrusted image bytes from catalog add and bulk-import phase 2 (`AssetImportService.ImportAssetsPhase2Async`).

**Output:** PNG/WebP with alpha, uploaded to Supabase Storage bucket `assets`. On vendor failure, store the original and log. Never a silent fake cutout.

**Human in the loop:** the warehouse operator sees the stored photo on the asset card and can replace it.

**Not this component:** layout generation, damage-photo analysis, identity, credit, or access decisions. No tools. No prompts from the catalog image treated as instructions.

**As-built:** `BackgroundRemovalService` sleeps 100ms and returns the same stream. The SPA modal chroma-key is a local preview hack and SHALL NOT be documented or shipped as the model.

**Target:** server-side third-party vision API behind `IBackgroundRemovalService`. Decision record: `rfc-lumiere-bg-removal.md`. Assurance: `aia-lumiere.md`.

## 8. Out of scope

- Payments, invoicing, public event ticketing.
- Multi-tenant company switcher as a sold SKU (Admin copy mentions companies; do not expand until F1–F8 close).
- AI generation of layouts.
- Commercial pricing, GTM, or a business case this cycle.

## 9. Metrics (when the wire exists)

- Events created that are visible on a second session within 5 seconds.
- Reservation conflict rate caught before dispatch prepare.
- Damage reports with matching event GUID vs orphaned.
- Catalog photos stored as cutouts vs originals after a vendor failure (must not be claimed as cutouts).

## 10. Rollout / rollback

- Big-bang for the API URL (`VITE_API_URL`). No dual localhost fallback in production builds.
- Rollback: Railway previous deploy. Vercel previous deployment. EF migrations must be forward-compatible or have a documented down.
- Feature flags not required for first ship if the SPA cannot reach localhost.
- Removal vendor key lives only in Railway. Rolling back the API image restores the previous removal behavior.

## 11. Trace

QAD, SDD, RFC, AIA, SAD, and domain files use these `PRD-F#` ids. Do not renumber.
