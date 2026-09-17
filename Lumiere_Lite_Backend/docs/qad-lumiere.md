# QA and Test Plan (QAD)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13

How we will know Must-Haves work. Automated xUnit test suite (`Lumiere.Tests`) is active. Cases below are the contract for local validation and CI.

## 1. Scope

Must-Haves PRD-F1–F8, F11, F14, F15. Should-Haves PRD-F9 (Manning Roster), PRD-F12 (Offline Field Sync), and PRD-F13 (Production Quotas) APIs are implemented and covered in automated tests in `Lumiere.Tests`.

## 2. Environments

- Local: API 8080, Vite 5173, Postgres or (today) InMemory. InMemory tests are not production evidence.
- Target: Vercel preview + Railway + Supabase Postgres.

## 3. Cases

### PRD-F1 Auth

- Happy: login `admin@lumiere.com` against API returns JWT.
- Sad: wrong password 401 after lockout rules (5 / 15 min in `AuthService`).
- Abuse: `login-debug` must not be callable anonymously in Production.
- Abuse: inactive user 401.

### PRD-F2 Admin governance

- Happy: Admin JWT provisions a user and assigns a seeded role. Audit row exists for the permission change.
- Sad: Ground Crew JWT on ephemeral-grant POST returns 403.
- Abuse: ephemeral grant cannot outlive the documented expiry. Hierarchy names that are not seeded (`SystemAdmin`) SHALL NOT be the only path to Admin.

### PRD-F3 Create Event

- Happy: create then GET list contains the GUID on a new browser profile.
- Sad: overlap 409.
- Sad: SPA production build does not keep the event only in memory.
- Fail today: drawer POST never fires. `title` is not `eventName`. `geoClass` is absent. A later wire that posts `NewEventDraft` as-is must fail this case.

### PRD-F4 Executive visibility

- Happy: Executive JWT lists portfolio events and can POST loss-maker acknowledgement for an event they can see.
- Sad: Ground Crew JWT on acknowledgement returns 403.
- Abuse: acknowledgement does not mutate another event's id via a swapped body id.

### PRD-F5 Reservations

- Happy: bulk reserve commits asset.
- Sad: National buffer overlap rejected.
- Abuse: planner JWT cannot prepare dispatch.

### PRD-F7 Dispatch

- Happy: prepare → packing list → verify item → In-Transit Outbound.
- Sad: prepare when queue already open.
- Abuse: Event Planner 403 on prepare.
- Fail today: Admin JWT cannot inherit `Warehouse Operations Manager`. Hierarchy names are not seeded.

### PRD-F8 Damage

- Happy: POST report, GET by event GUID returns it.
- Sad: missing photo rejected if product requires it (crew UI requires photo for Damaged).
- Abuse: settlement-blocked true while unsigned.
- Fail today: `createDamageReport` posts `boundEvent` / `imageUrl`. API needs `assetId` / `eventId` / `photoUrl` / `sha256Hash`. Settlement GET returns `isSettlementBlocked`. SPA types `blocked` and ignores the body.

### PRD-F11 Crew

- Happy: crew JWT opens field-ops, not Admin rail.
- Sad: Executive JWT on pwa route sees PortalAccessError.
- Abuse: crew cannot call Admin unblock.

### PRD-F14 Catalog cutout

- Happy (QAD-F14-H): catalog add or bulk-import phase 2 with a valid image stores a cutout PNG/WebP in Storage and `PhotoUrl` points at it.
- Sad (QAD-F14-S): vendor 5xx or timeout. Original stored. Log contains the failure. Response does not claim a cutout.
- Abuse (QAD-F14-A1): oversized or non-image upload rejected at the API. Vendor not called.
- Abuse (QAD-F14-A2): SPA build contains no vendor API key.
- Abuse (QAD-F14-A3): `POST /api/damage-reports` photo does not call `IBackgroundRemovalService`.
- Abuse (QAD-F14-A4): Production with the mock implementation registered fails this case. Silent passthrough is not a pass.
- Fail today: mock passthrough. SPA chroma-key is a second fake path.

### PRD-F15 Deploy

- Happy: from the Vercel origin, login reaches Railway HTTPS and stores a token.
- Sad: missing `VITE_API_URL` fails build or fails login closed.
- Abuse: Production API with Postgres down does not serve InMemory.

### Context hygiene (agents)

- Happy: work starts from `docs/state.md` and live code.
- Abuse: an agent treats deleted working-tree writeups or chat summaries as requirements. Fail the review if a PR "implements" a claim that exists only in git history and contradicts live code.

## 4. Regression

Role string drift: seeded `Warehouse Operations Manager` vs hierarchy `WarehouseSupervisor`. Asset create with WOM JWT must 201 after the claim fix.

## 5. Evidence

Until CI exists, a recorded script (Playwright or curl + JWT) that hits Railway and the Vercel origin is the bar. Compiling is not the bar.
