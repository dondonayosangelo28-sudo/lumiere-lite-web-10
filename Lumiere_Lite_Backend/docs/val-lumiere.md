# Validation Brief

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Draft
**Last reconciled:** 2026-09-12

Should we spend the next engineering slice on this product. Evidence is the running code, not a survey.

## 1. Opportunity

An event house that moves physical assets between venues needs one event id, conflict-safe reservations, a packing list, and field damage reports. The org already has those roles. Spreadsheets fail at double-booking and at venues with bad wifi.

## 2. Evidence we have

- Role shells and a Konva canvas exist and are demoable locally.
- API services exist for events, assets, reservations, dispatch, damage, deficit, vendors.
- Login JSON fields match. Create Event and damage create fields do not. The pair is two models, not one system. See `contracts-fe-be.md`.
- A static SPA already builds on Vercel. Login from that origin does not reach the API.

## 3. Evidence we do not have

- A paying customer or signed design partner.
- A measured double-booking incident log.
- Production uptime or error budget.

## 4. Kill criteria

Stop calling this a platform (and stop a production deploy) if any of these stay true after the next implementation slice:

1. Create Event disappears on refresh or on a second machine.
2. Login from the Vercel origin cannot obtain a JWT from the Railway API over HTTPS.
3. More than one database still owns users or events (EF users vs a browser `portal_accounts` table vs a Neon deployments table).
4. Production still boots on InMemory when Postgres is unreachable.
5. Production still registers mock `BackgroundRemovalService` or treats the SPA chroma-key as the catalog cutout.

## 5. Decision

Worth building the wire. Not worth deploying Docker + Vercel as-is. Next spend is integration of the existing API with the existing SPA, not a third UI.
