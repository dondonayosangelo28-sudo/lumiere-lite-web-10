# Events

**Project:** Lumiere
**Domain:** events
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F3, PRD-F4

## Purpose

Create and list events so every downstream module shares one identifier.

## As-built

- UI: Executive `EventRegistryPage` + `RegisterEventDrawer` call `store.tsx` `addEvent()`. Ids look like `e-${Date.now()}`. Status starts `Initialized`. Admin registry is read-only.
- Planner pipeline uses a separate seed (`pe-*` in `planner.tsx`).
- Warehouse PWA catalog uses a third set (`evt-0*` in `warehouse.tsx`).
- Ground crew page hardcodes its own events.
- API: `EventController` `POST /api/events` `[RequireRole("Admin")]`. `EventService.CreateEventAsync` writes Postgres, rejects venue+date overlap, sets status `Active`, can flag loss-maker when estimated revenue ≤ 0.
- CORS and the SPA never call that POST from the drawer.

## Wire

| FE (`NewEventDraft` / `PortalEvent`) | BE (`CreateEventRequest` / `EventResponse`) | Fit |
|--------------------------------------|---------------------------------------------|-----|
| `title` | required `eventName` | rename |
| `venue` | required `eventVenue` | rename |
| `targetDate` | required `dateOfEvent` | string vs DateTime |
| `installationStart` / `installationEnd` | required `ingressDate` + `ingressTime` + `fullStop` | time strings vs DateTime + TimeSpan |
| `client`, `moodPlan` | none | FE only |
| none | required `geoClass` `Local` \| `National` | BE only |
| `id` `e-${Date.now()}` | Guid | different space |
| status `Initialized` | status `Active` | different machine |
| list needs `refId`, `client`, `tier`, `budget`, `moodPlan` | list is `id`, `name`, `dateOfEvent`, `venue`, `status`, `isLossMaker` | GET cannot fill the drawer |

Event create sets `TransitBufferDays` Local 1, National 3. Reservation overlap pads National 3/5, Local 1/1.

## Production SHALL

1. The system SHALL persist Create Event through `POST /api/events` (or a dedicated command that writes the same `events` table).
2. The creating role SHALL match the product (Executive). If the attribute stays Admin, the UI SHALL stop offering Executive create.
3. One event id type SHALL be used in planner, warehouse, and crew (GUID from the API).
4. Warehouse Home SHALL read events from the API, not only in-tab React state.
5. Overlapping venue+date SHALL return 409.

## Scenarios

**Happy path**
- GIVEN Executive JWT
- WHEN create event with Local geo class and valid dates
- THEN GET `/api/events` includes the row after reload

**Overlap**
- GIVEN an Active event at venue V on date D
- WHEN a second create uses V and D
- THEN 409 and one row remains
