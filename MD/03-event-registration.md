# Event registration

**Project:** Lumiere
**Domain:** event-registration
**Version:** 1.0
**Status:** Implemented
**Last reconciled:** 2026-09-17
**PRD links:** TBD — confirm PRD ID with PM

## Purpose

Executive registers a new event via a "+ Event" form (title, client, venue, dates,
ingress/egress/full-stop times, start/end times); the event then shows up wherever
events are listed and persists to `POST /api/events`.

## As-built

- `RegisterEventDrawer.tsx` handles event initialization and edit modes, opened from both
  `EventDashboardPage.tsx`'s "+ Event" button and `EventRegistryPage.tsx`'s "Register New Event" button.
- Fields wired in the form / `NewEventDraft` (`src/lib/types.ts`): `title` (required),
  `client`, `venue`, `targetDate` (via `EventCalendar.tsx` picker), `installationStart`/`installationEnd`,
  `geoClass` (Local/National), `ingressDate`, `ingressTime`, `fullStop`, `returnDate` (Egress / Return Date),
  `moodPlan` (Creative Vision mapped to Notes / branding).
- On submit, `addEvent` in `src/lib/store.tsx` calls `createEventApi(draft)` (`src/lib/eventsApi.ts`)
  posting a valid `CreateEventRequest` payload to `POST /api/events`, and updates store state immediately with the resolved backend ID.

## Wire

| FE (`NewEventDraft`, `RegisterEventDrawer.tsx`) | BE (`CreateEventRequest`, `EventController.cs`) | Live | Fit |
|----|----|------|-----|
| `title` | `EventName` [Required] | yes | yes |
| `client` | client display in SPA; BE optional metadata | yes | aligned |
| `venue` | `EventVenue` [Required] | yes | yes |
| `targetDate` | `DateOfEvent` [Required] `DateTime` | yes | yes |
| `ingressDate` | `IngressDate` [Required] `DateTime` | yes | yes |
| `ingressTime` | `IngressTime` [Required] `TimeSpan` | yes | yes |
| `fullStop` | `FullStop` [Required] `TimeSpan` | yes | yes |
| `returnDate` | `ReturnDate` `DateTime` | yes | yes |
| `geoClass` | `GeoClass` [Required] (`Local` \| `National`) | yes | yes |
| `moodPlan` | `Notes` / `BrandingAndTextures` | yes | yes |
| `POST` trigger | `POST /api/events`, `[RequireRole("Executive")]`, returns `{ EventId }` | yes | yes |

## Production SHALL

1. Event creation SHALL POST to `POST /api/events` using `CreateEventRequest` instead of
   only updating `usePortal()` local state.
2. The spec's "Egress Time" field SHALL be reconciled with the backend's existing
   `ReturnDate` (`DateTime`) rather than added as a new, disconnected field — confirm with
   PM whether `ReturnDate` is a full date, a date+time, or needs a paired time field before
   wiring the FE control.
3. FE `client` SHALL be resolved before wiring: either (a) confirm Client Name is genuinely
   out of scope for the backend and drop it from the required-field expectation entirely,
   or (b) get a BE field added — do not silently map it to `Notes` or drop it without
   sign-off.
4. FE `moodPlan` (a single textarea) SHALL be split across `EventPegs`, `ColorPalette`,
   `BrandingAndTextures` (and optionally `Notes`) to fit the real request shape, once
   product confirms which BE field each maps to.
5. `installationStart`/`installationEnd` ("Start/End Time") SHALL be dropped from the wire
   payload or the BE SHALL gain matching fields — they currently have nowhere to go.
6. This wiring pass and `02-executive-dashboard.md`'s Production SHALL #3 (switching reads
   to `GET /api/events`) SHALL land together so the UI is not left reading live while
   writing local, or vice versa.

## Scenarios

**Live create (target end-state)**
- GIVEN an Executive JWT
- WHEN submitting the Register Event form with all required fields filled
- THEN `POST /api/events` is called with a `CreateEventRequest` body and the new event
  appears in `GET /api/events` on next fetch (not just in local `usePortal()` state)

**Current behavior (as-built, unresolved)**
- GIVEN an Executive account, no API changes
- WHEN submitting the Register Event form
- THEN the event appears in `EventRegistryPage`'s table and as a dot on `EventCalendar`
  immediately, because both read the same local store
- BUT a second browser session, or a refresh that re-fetches from `GET /api/events`, will
  not show it — this SHALL be treated as the expected symptom of Production SHALL #1 not
  being done yet, not a separate bug
