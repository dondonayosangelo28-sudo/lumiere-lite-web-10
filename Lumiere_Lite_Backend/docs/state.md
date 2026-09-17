# Project State: Lumiere

**Project slug:** `lumiere`
**Owner:** Lumiere team
**Last updated:** 2026-09-13

This file is the operating dashboard. It is not a substitute for the PRD, SDD, or domain files. Those files repeat the facts they need.

## 1. Position

| Field | Value |
|-------|-------|
| **Current milestone** | Specify |
| **Entered on** | 2026-09-12 |
| **Exit condition** | Must-Haves in `prd-lumiere.md` are agreed, including Create Event persistence, one API origin, and PRD-F14 as a shipping catalog cutout |
| **Next milestone** | Shape |
| **Current blocker** | Login and damage hardcode `http://localhost:8080`. Create Event fields do not match `CreateEventRequest`. Damage POST keys do not match `CreateDamageReportRequest`. Background removal is a mock passthrough. Field pairs are in `contracts-fe-be.md`. |
| **Owner of the next step** | Engineering, after this Draft suite is reviewed |

**What we are building, in one line:** An event resource planning platform that takes an event from executive intake through canvas allocation, warehouse dispatch, and field reporting on one Postgres-backed API, with catalog photo cutouts from a real removal service.

**Engagement type:** Technical production build. No commercial, pricing, or go-to-market design this cycle.

**Vault status:** configured

## 2. Active signals

| Signal | True? | Evidence | Requires |
|--------|-------|----------|----------|
| S1 Frontend exists | yes | Vite + React 19 SPA in Lumiere-UI | DSD |
| S2 Backend, data, security boundary | yes | ASP.NET Core 10 API, JWT, EF, Postgres | SDD |
| S3 Material architectural trade-off | yes | Deploy host + store in `rfc-lumiere-deploy.md`. Removal provider in `rfc-lumiere-bg-removal.md`. | RFC |
| S4 Non-trivial product behavior | yes | Five account types, event lifecycle, catalog cutout | PRD |
| S5 Agent or team implementation | yes | Two-repo production implementation | BUILD |
| S6 Repeated specialist work | yes | Human decision. Four-agent roster for a two-repo production run. | SAD |
| S7 Release to users intended | yes | Vercel SPA + Railway API north star | QAD |
| S8 Production deployment exists | partial | Static SPA hosts exist. Logged-in production path does not. | OPS as target |
| S9 User data collected | yes | Emails, JWT, damage photos, optional GPS, catalog photos to a vendor | CLR |
| S11 Public surface | yes | Public SPA URLs | public-surface in BUILD |
| S12 AI/ML component ships | yes | PRD-F14 catalog background removal. Mock today. Target is a real provider behind `IBackgroundRemovalService`. | AIA |
| S20 External integrations | yes | Supabase client, vision vendor (target), Neon deployments route (retire) | SDD |
| S23 Brownfield | yes | Working code in two repos | this suite |

**Deliberate absences**

- S13 false. No payments. No UES.
- S14 false. No named buyer. No OPP/PROP.
- S15 false. No funding ask. No BRD.
- S21 false this cycle. No GTM.
- S22 false. No PITCH or WRAP.

**Legacy preset:** none. Signals win.

## 3. Operating frameworks

| Dimension | Choice | Why |
|-----------|--------|-----|
| **Project management** | Milestones | FMD. Specify now. Shape next. |
| **Engineering maturity** | L0 Local Validation | No CI. Public URL exists, so L2 is the next honest target after a green pipeline, not a claim today. |
| **Subagents** | SAD-A1 to SAD-A4 | Recorded in `sad-lumiere.md`. Spawn from that roster. |

## 4. Open assumptions

| ID | Assumption | Risk if wrong | Reversible? | Owner | Resolve by |
|----|-----------|---------------|-------------|-------|------------|
| A1 | This cycle is a technical production build, not a sold SKU | Wrong docs if a buyer or price appears | yes | Product | Specify review |
| A2 | First ship is Vercel + Railway Docker + one Supabase Postgres | Wrong secrets and CORS work | yes until first paid prod | Eng | RFC lock |
| A3 | EF owns schema. Hand-written SQL under `supabase/migrations` is not applied at runtime | Schema clash in a hosted Supabase project | yes | Eng | Shape |
| A4 | GCP Cloud Run is promotion, not first ship | Extra ops if Railway is forbidden by policy | yes | Eng | RFC lock |
| A5 | Primary named user is a Warehouse Operations Manager; Executive initiates events | Wrong Create Event owner | yes | Product | PRD lock |
| A6 | Catalog cutouts go through the API `IBackgroundRemovalService`. The SPA chroma-key in `AddAssetModal.tsx` is not the model. | Fake ML in production | yes | Eng | RFC lock |

**Open questions**

None. (Canonical production hostname `lumieredemo-seven.vercel.app` confirmed; `rfc-lumiere-bg-removal.md` locked.)

## 5. Decisions

| ID | Question | Decision | Evidence class | Review when |
|----|----------|----------|----------------|-------------|
| D1 | Frontend host | Vercel Vite SPA | Human Decision | First ship |
| D2 | API host | Railway running `Dockerfile` | Human Decision | First ship |
| D3 | Database | One Supabase Postgres. EF is schema owner. Neon deployments route retired in target. | Human Decision | RFC lock |
| D4 | Docs location | Product home is this repo `docs/`. SPA-only files live in Lumiere-UI `docs/`. Workspace `d:\PROJECTS\lumiere\docs` is not a live tree. | Human Decision | This pass |
| D5 | Catalog cutout | Shipping v1 feature (PRD-F14). Server-side provider behind `IBackgroundRemovalService`. No key in the SPA. | Human Decision | RFC lock |
| D6 | Subagents | Persist SAD-A1..A4 for the production implementation run | Human Decision | Shape |
| D7 | Create Event ownership | Executive creates, Admin updates/deletes | Human Decision | Shape |
| D8 | Production seed strategy | Production database seeds roles only, no demo accounts or demo passwords (lumiere2026 must not exist in Production). *(TEMPORARY EXCEPTION active for defense demo presentation; MUST be reverted post-defense)* | Human Decision | First ship |

## 6. Context exclusions

Prior in-repo writeups and agent progress notes are invalid as requirements. Reconstruct from git history if you must see an old claim. Do not load deleted working-tree files as current context. Live code and the Draft files in this folder are the record. Do not load a workspace-root `docs/` folder as current if this repo `docs/` disagrees.

## 7. Next actions

1. Review and lock `rfc-lumiere-deploy.md` (Vercel + Railway + Supabase Postgres).
2. Review and lock `rfc-lumiere-bg-removal.md`.
3. Introduce `VITE_API_URL`, CORS for the real Vercel origin, and refuse InMemory in Production.
4. Wire Create Event, reservations, dispatch, and damage to the ASP.NET API using the pairs in `contracts-fe-be.md`. Do not POST the drawer JSON as-is.
5. Replace mock `BackgroundRemovalService` per the removal RFC and AIA.

**Artifact plan for this slice**

| Artifact | Why it is justified now | Status |
|----------|-------------------------|--------|
| STATE | First FMD action | current |
| INDEX | More than one artifact | current |
| LOG | Session audit in product home | open |
| IDEA, SCRUTINY, VALIDATION | Frame / Decide | Draft |
| PRD, DSD, SDD, RFC deploy, RFC removal | S1 S2 S3 S4 S12 | Draft |
| QAD, BUILD, CLR, OPS | S5 S7 S9 | Draft |
| AIA | S12 | Draft |
| SAD | S6 | Draft |
| Domain files | Whole-product re-ground | Draft |
| How-tos | Local run and north-star deploy | Draft |

Untriggered on purpose: BRD, UES, GTM, PITCH, WRAP, OPP, PROP.

## 8. Self-Check

| Check | Done | Notes |
|-------|------|-------|
| Milestone and exit condition are current | [x] | Specify, F14 in exit |
| Every listed signal has real evidence | [x] | Code paths named |
| Every assumption made this session is in §4 | [x] | A1–A6 |
| Material decisions are in §5 | [x] | D1–D6 |
| Artifact plan contains no untriggered artifact | [x] | No BRD/UES/GTM/PITCH/WRAP/OPP/PROP |
| Context exclusions updated | [x] | Workspace docs/ not live |
| Index rows will match disk after INDEX write | [x] | INDEX last |
