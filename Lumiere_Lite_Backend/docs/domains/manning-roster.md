# Manning and roster

**Project:** Lumiere
**Domain:** manning-roster
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F9

## Purpose

Assign people to events and days without double-booking a body the way reservations lock assets.

## As-built

- `DbInitializer` seeds Manning Officer: "Crew assignments and rosters".
- There is no roster or assignment controller in `Lumiere.API`.
- UI `manning.ts` tries browser Supabase `manning_assignments` and falls back to presets. "Double Booked" is an override audit record, not a lock.
- `roster.ts` seeds `CREW` then optionally `crew_roster`.
- Those tables are not in the EF model.

## Wire

No HTTP contract. UI fields (`event_name`, assignment rows in `manning_assignments`) have no DTO. Do not treat browser Supabase columns as the API.

## Production SHALL

1. v1 MAY ship without PRD-F9 if F1–F8 are closed. This file exists so the role is not mistaken for an API.
2. If shipped, assignments SHALL persist on the ASP.NET API against Postgres owned by EF, with an overlap check analogous to `ReservationService`.
3. The system SHALL NOT treat a UI override toast as a lock.

## Scenarios

**Not implemented**
- GIVEN current API
- WHEN GET a roster route
- THEN 404 (no controller)

**Future lock**
- GIVEN person P assigned to E1 on date D
- WHEN assign P to E2 on D
- THEN conflict unless an explicit override with audit
