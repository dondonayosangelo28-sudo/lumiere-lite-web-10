# Idea Brief (IDEA)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Draft
**Last reconciled:** 2026-09-12
**Event / context:** Brownfield re-ground. Production intent. Concept visuals not generated this pass, so this file stays Draft.

This file names the product. It does not describe the current demo wiring. As-built vs target lives in `sdd-lumiere.md` if you want that split. You can use this file without reading the others.

## 1. The Spark

**Production intent:** Real product from day one. A demo that dies on refresh is not the product.

**One-line pitch:** Lumiere is the operating system for an event house that rents and crews physical assets, from the first event record through warehouse dispatch and on-site damage reports.

**Problem:** Event metadata, peg layouts, stock, trucks, and field reports live in separate heads and spreadsheets. Double-booking shows up on load-in day. Venue wifi drops and the crew cannot file what broke.

**Insight (why us, why now):** The company already thinks in five account types (Admin, Executive, Event Planner, Warehouse Operations Manager, Ground Crew). The software must be that org chart with one event id, not five portals with five catalogs.

## 2. Who hurts

**Primary user:** Maya, Warehouse Operations Manager at a Manila production-rental house. She owns stock counts, packing lists, and who is on the truck.

**Moment of pain:** Friday 16:00. Two events share Chiavari chairs. The planner's canvas says they are allocated. The warehouse sheet still shows Available. She finds out when the second truck is empty.

**Executive (secondary):** Ramon opens the registry, types venue and date, and expects warehouse and crew to see that event after refresh, on another machine.

**Event Planner:** needs a Canva-like board whose allocations are real reservations, not decoration.

**Ground Crew:** on a dark loading dock with bad signal, must confirm outbound, inbound/return, and damage with a photo.

## 3. If we only ship one thing

Executive Create Event persists in the API database and is visible to Planner, Warehouse, and Ground Crew after a full reload on another browser.

Without that, nothing else is a platform.

## 4. Demo moment

Ramon creates "La Nuit Dorée". Maya sees it on Warehouse Home. The planner commits chairs. Maya prepares dispatch. Crew on a phone confirms outbound and files a damaged chair. Ramon sees the damage queue. Refresh does not invent a new universe.

## 5. Constraints

- Frontend host: Vercel (Vite SPA).
- API host: Railway, existing `Dockerfile`, ASP.NET Core 10.
- Data: one Supabase Postgres. EF Core owns schema. Realtime and Storage stay as add-ons the API already calls.
- Auth: application JWT (BCrypt users), not a second browser identity table.
- Ground-crew installable PWA is after the online path works.
- No concept frames in `docs/assets/concept/` this pass.
- Catalog photo cutouts are in v1 (PRD-F14). The API service is the model. A SPA chroma-key is not.

## 6. Non-goals for the first production slice

- Consumer marketplace.
- AI generation of layouts.
- GCP Cloud Run as the first host.
- A second Postgres (including a Neon table used only by a Vercel function).
- Commercial pricing or GTM this cycle.
