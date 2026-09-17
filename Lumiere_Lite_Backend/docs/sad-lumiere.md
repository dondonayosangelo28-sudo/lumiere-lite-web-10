# Subagents Document (SAD)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13
**PRD:** [prd-lumiere.md](prd-lumiere.md)
**SDD:** [sdd-lumiere.md](sdd-lumiere.md)
**QAD:** [qad-lumiere.md](qad-lumiere.md)
**AIA:** [aia-lumiere.md](aia-lumiere.md)

This roster is for the technical production implementation. It is not a staffing plan. Edit this file, then re-materialize. Do not hand-edit the Cursor copies as source.

## 1. Purpose and scope

Four specialists run the two-repo production slice: API field wiring, SPA production origin, catalog cutout, and QAD evidence. The main agent orchestrates. Humans lock RFCs. Subagents do not invent product or architecture.

**Out of scope:** product decisions, RFC lock, counsel, commercial docs.

**Platform:** Cursor. Cards materialize to `.cursor/rules/` in this repo and in Lumiere-UI for the SPA agent.

## 2. Roster design rationale

| Considered | Decision | Reason |
|------------|----------|--------|
| SAD-A1 api-integrator | Kept | Repeated across F3, F7, F8. Protects main context from dual-repo field mismatch. |
| SAD-A2 spa-production-wire | Kept | Repeated F1, F5, F15. SPA repo is a separate tree. |
| SAD-A3 bg-removal | Kept | PRD-F14 plus AIA/RFC. Specialist path, untrusted image bytes. |
| SAD-A4 qad-runner | Kept | Guardrail. Must not skip happy/sad/abuse. |
| design-token-auditor | Rejected | DSD is small. Main agent can keep tokens inline. |
| compliance-checker | Rejected | CLR is a short register. Main agent keeps it. |
| docs-writer | Rejected | This pass already wrote the suite. |

## 3. The roster

| Agent ID | Name | One-line job | Derived from | Spawn trigger | Model hint |
|----------|------|--------------|--------------|---------------|------------|
| SAD-A1 | api-integrator | Wire Create Event, dispatch, and damage to the API field pairs | PRD-F3, F7, F8, contracts-fe-be.md | Implementing or reviewing those endpoints or the matching UI posts | balanced |
| SAD-A2 | spa-production-wire | `VITE_API_URL`, CORS origin, canvas reservations, no localhost hardcode | PRD-F1, F5, F15 | Any SPA change that talks to the API or ships to Vercel | balanced |
| SAD-A3 | bg-removal | Implement `IBackgroundRemovalService` per RFC and AIA | PRD-F14, SDD §8, rfc-lumiere-bg-removal.md, aia-lumiere.md | Replacing the mock or touching catalog photo ingest | deep |
| SAD-A4 | qad-runner | Run happy/sad/abuse including F2, F4, F14 | QAD | After implementation slices, before claiming a Must-Have done | fast |

### Agent cards

#### SAD-A1; api-integrator

- **Purpose:** Close the production loop for events, dispatch, and damage. Meets anti-sprawl (repeated + context).
- **Derived from:** PRD-F3, PRD-F7, PRD-F8, [contracts-fe-be.md](contracts-fe-be.md)
- **Responsibilities:**
  - Map SPA fields to `CreateEventRequest`, dispatch DTOs, and `CreateDamageReportRequest`.
  - Do not POST drawer JSON as-is.
  - Keep one event GUID across reload.
- **Inputs:** `docs/contracts-fe-be.md`, named controller/DTO files, the PRD-F# under work. Untrusted: browser payloads.
- **Outputs:** patches in this API repo and a short field-pair report. SPA posts may be noted for SAD-A2.
- **Capabilities / tools needed:** read, grep, edit C# in this repo. No vendor key files.
- **Spawn trigger:** implementing F3, F7, or F8, or a contract mismatch.
- **Guardrails (never):** never add a fourth data store. Never silently edit a Locked RFC. Never treat git-history writeups as requirements.
- **Done when:** the pairs in `contracts-fe-be.md` for the feature are live, or a remaining mismatch is listed with file:line.
- **Model hint:** balanced

#### SAD-A2; spa-production-wire

- **Purpose:** Production SPA talks only to `VITE_API_URL`. Meets anti-sprawl (repeated, other repo).
- **Derived from:** PRD-F1, PRD-F5, PRD-F15
- **Responsibilities:**
  - Replace hardcoded `http://localhost:8080` in `auth.tsx`, `damageApi.ts`, and any new callers.
  - Canvas allocations call `POST /api/reservations`.
  - Production build fails closed if the API URL is localhost HTTP.
- **Inputs:** Lumiere-UI `src/lib/auth.tsx`, `src/lib/damageApi.ts`, canvas workspace, `docs/howto-deploy-vercel.md`. Untrusted: env values.
- **Outputs:** SPA patches. Does not change Railway secrets.
- **Capabilities / tools needed:** read, grep, edit TS/TSX in Lumiere-UI.
- **Spawn trigger:** any SPA API client or Vercel env change.
- **Guardrails (never):** never put JWT secret or removal vendor key in Vercel. Never keep a dual localhost fallback in production builds. Never call the vision vendor from the browser.
- **Done when:** grep for `localhost:8080` in production client paths is empty, or remaining hits are listed. Canvas reserve path is named.
- **Model hint:** balanced

#### SAD-A3; bg-removal

- **Purpose:** Replace the mock with the locked vendor behind `IBackgroundRemovalService`. Isolates untrusted image bytes. Meets anti-sprawl (specialist + guardrail).
- **Derived from:** PRD-F14, SDD §8, [rfc-lumiere-bg-removal.md](rfc-lumiere-bg-removal.md), [aia-lumiere.md](aia-lumiere.md)
- **Responsibilities:**
  - HTTP client with timeout, size cap, content-type check.
  - Fail to original + log. Never silent passthrough in Production.
  - Demote or delete SPA chroma-key as the production path.
  - Cite QAD-F14 and AIA-R1..R7 in the handoff.
- **Inputs:** RFC, AIA, `BackgroundRemovalService.cs`, `AssetImportService.cs`, `AddAssetModal.tsx`. Untrusted: image streams.
- **Outputs:** API implementation patches. SPA preview-only change if needed. No public MODEL_CARD.
- **Capabilities / tools needed:** read, edit C# and TS. No production key in repo.
- **Spawn trigger:** implementing F14 or touching catalog photo ingest.
- **Guardrails (never):** never commit the vendor key. never send damage photos through this service. never register the mock in Production. never auto-execute model output on auth, delete, or privilege paths (this service has no such paths; keep it that way).
- **Done when:** QAD-F14-H/S/A1–A4 can be run. AIA-R1 is no longer Open for the mock.
- **Model hint:** deep

#### SAD-A4; qad-runner

- **Purpose:** Guardrail. Evidence against QAD, not compile-green.
- **Derived from:** [qad-lumiere.md](qad-lumiere.md)
- **Responsibilities:**
  - Run or script happy/sad/abuse for the slice, including F2, F4, and F14 when those features moved.
  - InMemory results are not production evidence.
  - Return PASS or FAIL with the smallest log excerpt.
- **Inputs:** QAD section for the PRD-F#s in the slice. Live API origin. Untrusted: prior agent "it works" summaries.
- **Outputs:** verdict. No source edits to make a test pass by deletion.
- **Capabilities / tools needed:** shell, read. Optional Playwright/curl.
- **Spawn trigger:** after an implementation slice, before calling a Must-Have done.
- **Guardrails (never):** never skip abuse cases. never treat compile as the bar. never delete tests to go green.
- **Done when:** PASS, or FAIL with named cases and excerpts.
- **Model hint:** fast

## 4. Orchestration

- **Who spawns them:** main agent on demand. Developer may point Cursor at a materialized rule.
- **Sequencing:** SAD-A1 and SAD-A2 may run in parallel on different trees. SAD-A3 is independent except Storage. SAD-A4 gates the claim that a Must-Have is done.
- **Hand-off:** file:line and ID citations. Prior-agent summaries are claims, not authority.
- **Escalation:** stop for RFC still Draft when the change is the locked decision, counsel flags in AIA §4, or contradiction with a Locked artifact.

\`\`\`
main ──▶ api-integrator (A1) ─┐
     ──▶ spa-production-wire (A2) ─┼──▶ qad-runner (A4) ──gate──▶ Must-Have claim
     ──▶ bg-removal (A3) ─────────┘
\`\`\`

**Re-ground:** before a long spawn chain, after a CR, and when unverified agent output is about to become fact, re-read `docs/index.md` plus PRD/SDD IDs. Do not inherit a rotten parent summary.

## 5. Materialization (Cursor)

Primary platform: Cursor.

| Agent ID | Materialized file | Format |
|----------|-------------------|--------|
| SAD-A1 | `Lumiere/.cursor/rules/sad-api-integrator.mdc` | Cursor rule |
| SAD-A2 | `Lumiere-UI/.cursor/rules/sad-spa-production-wire.mdc` | Cursor rule |
| SAD-A3 | `Lumiere/.cursor/rules/sad-bg-removal.mdc` | Cursor rule |
| SAD-A4 | `Lumiere/.cursor/rules/sad-qad-runner.mdc` | Cursor rule |

Re-materialize when a card changes. The SAD remains canonical.

## 6. Maintenance

Edit cards here, bump version, re-materialize. If a `PRD-F#` is cut, drop the agent that only existed for it.
