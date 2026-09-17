# Documentation Index: Lumiere API

**Project slug:** `lumiere`
**Maintained by:** Lumiere team
**Last updated:** 2026-09-13

Product home for this repository. Each file is usable alone. The SPA lives in Shunrenn/Lumiere-UI. This is a technical production build. No BRD, UES, GTM, PITCH, WRAP, OPP, or PROP.

## 1. Artifact inventory

| Artifact | File | Version | Status | Last Updated | Last Reconciled |
|----------|------|---------|--------|--------------|-----------------|
| STATE · Operating position | [state.md](state.md) | - | Current | 2026-09-13 | 2026-09-13 |
| LOG · Session log | [log-lumiere.md](log-lumiere.md) | - | Open | 2026-09-12 | 2026-09-12 |
| IDEA · Idea Brief | [idea-lumiere.md](idea-lumiere.md) | 0.1 | Draft | 2026-09-12 | 2026-09-12 |
| SCRUTINY · Scrutiny Gate | [scrutiny-lumiere.md](scrutiny-lumiere.md) | 0.1 | Draft | 2026-09-12 | 2026-09-12 |
| VALIDATION · Validation Brief | [val-lumiere.md](val-lumiere.md) | 0.1 | Draft | 2026-09-12 | 2026-09-12 |
| PRD · Product Requirements | [prd-lumiere.md](prd-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| SDD · System Design | [sdd-lumiere.md](sdd-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| RFC · Deploy and store | [rfc-lumiere-deploy.md](rfc-lumiere-deploy.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| RFC · Catalog cutout | [rfc-lumiere-bg-removal.md](rfc-lumiere-bg-removal.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| QAD · QA and Test Plan | [qad-lumiere.md](qad-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| BUILD · Build Guide | [build-lumiere.md](build-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| CLR · Compliance register | [clr-lumiere.md](clr-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| OPS · Operations | [ops-lumiere.md](ops-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| AIA · AI Assurance | [aia-lumiere.md](aia-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| SAD · Subagents | [sad-lumiere.md](sad-lumiere.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |
| CONTRACTS · FE/BE fields | [contracts-fe-be.md](contracts-fe-be.md) | 0.1 | Locked | 2026-09-13 | 2026-09-13 |

**Materialized at repo root:** [AGENTS.md](../AGENTS.md) from BUILD. Do not hand-edit as source.

**Domains**

| Domain | File | Version | Status |
|--------|------|---------|--------|
| Identity and RBAC | [domains/identity-rbac.md](domains/identity-rbac.md) | 0.1 | Draft |
| Events | [domains/events.md](domains/events.md) | 0.1 | Draft |
| Assets and inventory | [domains/assets-inventory.md](domains/assets-inventory.md) | 0.1 | Draft |
| Dispatch | [domains/dispatch.md](domains/dispatch.md) | 0.1 | Draft |
| Damage and deficit | [domains/damage-deficit.md](domains/damage-deficit.md) | 0.1 | Draft |
| Manning and roster | [domains/manning-roster.md](domains/manning-roster.md) | 0.1 | Draft |

**How-tos**

| File | Version | Status |
|------|---------|--------|
| [howto-local-dev.md](howto-local-dev.md) | 0.1 | Draft |
| [howto-deploy-railway.md](howto-deploy-railway.md) | 0.1 | Draft |

Not present (untriggered): BRD, UES, GTM, PITCH, WRAP, OPP, PROP. No public MODEL_CARD this cycle.

### 1.1 Traceability

| PRD-F# | Feature | Priority | In SDD | In QAD | In RFC |
|--------|---------|----------|--------|--------|--------|
| PRD-F1 | Auth | Must-Have | yes | yes | deploy |
| PRD-F2 | Admin governance | Must-Have | yes | yes | no |
| PRD-F3 | Create Event | Must-Have | yes | yes | deploy |
| PRD-F4 | Executive visibility | Must-Have | yes | yes | no |
| PRD-F5 | Planner canvas | Must-Have | yes | yes | no |
| PRD-F6 | Asset catalog | Must-Have | yes | yes (role drift) | no |
| PRD-F7 | Dispatch | Must-Have | yes | yes | no |
| PRD-F8 | Damage and deficit | Must-Have | yes | yes | no |
| PRD-F11 | Ground crew online | Must-Have | yes | yes | no |
| PRD-F14 | Catalog cutout | Must-Have | yes §8 | yes | bg-removal |
| PRD-F15 | Deploy north star | Must-Have | yes | yes | deploy |

## 2. Change log

### 2026-09-13
- **Canonical production hostname:** Confirmed `lumieredemo-seven.vercel.app` as production Vercel origin (not `lumiere-kappa-five.vercel.app`). Updated CORS references in `sdd-lumiere.md` §5 and resolved open question in `state.md` §4.
- **Deploy RFC locked:** Locked `rfc-lumiere-deploy.md` (Status: Locked). Confirmed Vercel + Railway + Supabase Postgres target architecture and canonical Vercel origin.
- **Background removal RFC locked:** Locked `rfc-lumiere-bg-removal.md` (Status: Locked). Confirmed `remove.bg` as final vendor choice behind `IBackgroundRemovalService`.
- **Create Event ownership decision (D7):** Locked decision in `prd-lumiere.md` §6 and `state.md` §5 (D7): Executive creates, Admin updates/deletes.
- **Production seed strategy decision (D8):** Locked decision in `state.md` §5 (D8): Production database seeds roles only, no demo accounts or demo passwords (`lumiere2026` must not exist in Production). Cross-referenced in `clr-lumiere.md` §5 launch gate and `ops-lumiere.md` §3.

## 3. Incident log

None.

## 4. Health check

- All listed files exist as Draft except STATE (current), LOG (open), and RFC deploy/bg-removal (Locked).
- Production Readiness Gate: fail (localhost API, InMemory fallback, secrets in git, no healthcheck, no CI, mock cutout).
- IDEA stays Draft (no concept visuals).
- RFC deploy and RFC removal are Locked as confirmed architectural decision records.
- AIA go/no-go: no-go for production catalog ingest until AIA-R1, R2, R3 are Mitigated.
