# Executive dashboard

**Project:** Lumiere
**Domain:** executive-dashboard
**Version:** 1.0
**Status:** Implemented
**Last reconciled:** 2026-09-17
**PRD links:** TBD — confirm PRD ID with PM (source is a raw notes doc, not a PRD)

## Purpose

Executive opens a mobile-first landing screen, searches/registers events, and sees a
calendar with dot-indicated booked dates and that month's event rows. No analytics on
this account per the source notes.

## As-built

- `ExecutiveShell` (`executive/ExecutiveShell.tsx`) is the fixed console frame: icon rail
  (`ExecutiveRail`) + `ExecutiveTopBar` outside the scroll region, mirrors `AdminShell`.
- `ExecutiveTopBar.tsx` renders live date/time, `NotificationsBell`, and a profile menu —
  matches spec.
- The `dashboard` destination (`executive-destinations.ts`) renders `EventDashboardPage.tsx`,
  which is a calendar-first operations landing page: search bar, "+ Event" action button,
  `EventCalendar` (dot-indicated booked dates, synced month navigation, day filtering),
  and a month-scoped event schedule row list with view and edit action drawers.
- Reuses `EventCalendar.tsx` and `RegisterEventDrawer.tsx` directly.
- Analytics components (`ExecutiveAnalytics.tsx`, `ExecutiveLiveFeed.tsx`, etc.) are retained
  in the repository without being rendered on the Executive dashboard route, pending PM confirmation
  on a dedicated `analytics` destination.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `EventDashboardPage` stat cards / donut / trend chart, computed client-side from `usePortal().events` and `.damageExceptions` | none — no analytics/reporting endpoint found in `Lumiere.API/Controllers` | no | no |
| `EventRegistryPage` search/filter/table over `usePortal().events` | `GET /api/events` (`EventController`) → `EventResponse` | partial — `fetchEventsApi()` in `src/lib/eventsApi.ts` calls this, but only `DesignCanvasHubPage` invokes it; `EventRegistryPage`/`EventDashboardPage` read local store state only | no |
| `EventCalendar` dot-indicator + month nav | n/a (client-side render of whatever events are already in state) | — | — |

## Production SHALL

1. The Executive dashboard destination SHALL render a search bar, a "+ Event" trigger, and
   a calendar (dot-indicated booked dates, synced month nav) above the fold — reusing
   `EventCalendar.tsx` and `RegisterEventDrawer.tsx` rather than rebuilding them.
2. Analytics widgets currently in `EventDashboardPage.tsx` SHALL NOT ship on the Executive
   landing route once the calendar-first view lands. This SHALL be resolved by confirmation
   (relocate to a new `analytics` rail destination vs. delete) before either is coded —
   see Scenario "Analytics relocation."
3. `EventRegistryPage` and `EventDashboardPage` SHALL read events from `GET /api/events`
   (already wired in `eventsApi.ts`) instead of `usePortal()` in-memory-only state, once
   event creation (Production SHALL #4 in `03-event-registration.md`) is also live —
   these two SHALL land together, not independently, to avoid a UI that reads live but
   writes local.

## Scenarios

**Landing shows calendar, not analytics**
- GIVEN an Executive account
- WHEN opening the `dashboard` destination
- THEN a search bar, "+ Event" button, and a ⅓-height calendar with dot-indicated dates
  render above an event list for the selected month
- AND no stat cards, donut chart, or trend chart render on this route

**Analytics relocation (open — needs PM confirmation)**
- GIVEN the existing `ExecutiveAnalytics.tsx` / `ExecutiveLiveFeed.tsx` components
- WHEN the calendar-first landing replaces `EventDashboardPage.tsx`'s current content
- THEN either a new `analytics` rail destination hosts them, or they are removed —
  **not yet decided; do not delete without this confirmation**

**Registry table stays live-inconsistent (known gap)**
- GIVEN `EventRegistryPage.tsx` currently filters/sorts `usePortal().events`
- WHEN a second browser session creates an event via a live-wired flow (once #4 in the
  event-registration doc ships)
- THEN this page will not reflect it until it is also switched to `GET /api/events` —
  flagged as a locked sequencing dependency, not an independent fix
