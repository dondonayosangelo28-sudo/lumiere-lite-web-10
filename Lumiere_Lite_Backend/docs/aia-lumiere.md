# AI Assurance Dossier (AIA)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13
**PRD:** [prd-lumiere.md](prd-lumiere.md) §7, PRD-F14
**SDD:** [sdd-lumiere.md](sdd-lumiere.md) §8
**QAD:** [qad-lumiere.md](qad-lumiere.md) PRD-F14
**CLR:** [clr-lumiere.md](clr-lumiere.md)
**RFC:** [rfc-lumiere-bg-removal.md](rfc-lumiere-bg-removal.md)

---

Governance and assurance-readiness awareness only. NOT an audit and NOT a certification. This dossier does not certify ISO/IEC 42001, does not discharge EU AI Act duties, and does not replace a qualified assessor or a licensed attorney. FMD produces the record. A competent assessor performs the audit. Any item flagged counsel/assessor needed must be escalated before launch.

---

## 0. Trigger and scope

| Field | Value |
|-------|-------|
| AI component (PRD §7) | Catalog photo background removal |
| Realizing feature ID(s) | PRD-F14 |
| System boundary | In: catalog add and bulk-import phase 2 image bytes, `IBackgroundRemovalService`, Storage URL on `Asset.PhotoUrl`. Out: damage photos, layout generation, SPA chroma-key, coding assistants. |
| Autonomy level | Generates a cutout for operator review. Takes no action. Calls no tools. Does not grant access, money, or employment. |
| Provisional risk classification (awareness) | Not an EU AI Act Annex III high-risk system on current intended use. Confirm with counsel if catalog photos routinely include identifiable people sent to a foreign vendor. |

**Why an AIA here:** PRD-F14 ships in v1. Operators will store vendor-processed images. The component must be assessable before production catalog ingest.

**As-built:** mock passthrough. This dossier describes the target after `rfc-lumiere-bg-removal.md` is implemented. Do not launch while the mock is registered.

**Self-check:**

- [x] The AI component and its feature ID(s) trace to PRD §7 / SDD §8
- [x] The provisional risk classification is stated as awareness, not a legal conclusion

## 1. Model / system card

### 1.1 Intended use

| Field | Value |
|-------|-------|
| Intended use | Cut warehouse or studio backdrop from asset catalog photos so the card shows the object. |
| Intended users / affected parties | Warehouse operators (Maya). People who appear in the background of a photo if any. |
| Out-of-scope / prohibited uses | Layout generation. Damage-photo analysis. Identity. Credit or access decisions. Treating SPA chroma-key as the model. Treating mock passthrough as a cutout. |
| Human-in-the-loop points | Operator sees `PhotoUrl` on the asset card and can replace the image. |

### 1.2 Model(s) and data

| Model / stage | Identifier + version | Role | Source of data it sees |
|---------------|----------------------|------|------------------------|
| As-built mock | `BackgroundRemovalService` passthrough | Not a model | Catalog image stream, returned unchanged |
| Target vendor | Locked in `rfc-lumiere-bg-removal.md`. Default recommendation: remove.bg HTTP API. Pin version/date at implement time. | Cutout | Catalog image bytes only |

- **Training / tuning data:** none of ours. Vendor-trained. Record vendor training-on-inputs terms in CLR before first real photo.
- **Run-time input:** untrusted catalog image bytes. Not prompts. Not damage photos.
- **Output contract:** PNG/WebP with alpha on success. Original image plus log on failure. Invalid type/size rejected before the vendor call.
- **Provider data terms:** TBD until RFC lock. CLR sub-processor row must be filled before launch.

### 1.3 Limitations and performance caveats

- Cutout quality depends on the vendor. Busy warehouse backgrounds will fail more often than studio shots.
- Failures must surface as originals, not as fake transparency.
- **Known failure modes:** timeout, 5xx, non-image upload, key missing in Production, SPA chroma-key mistaken for success.
- **Fallback behavior:** store original, log, do not claim a cutout (SDD-8.1-07).

**Self-check:**

- [x] Intended use AND out-of-scope use are both stated
- [ ] Concrete vendor version identifier after RFC lock
- [ ] Provider retention/training terms recorded in CLR before first real photo

## 2. NIST AI RMF risk register

Sources verified 2026-09-12: [NIST AI RMF 1.0 (NIST AI 100-1, January 2023)](https://doi.org/10.6028/NIST.AI.100-1) functions Govern / Map / Measure / Manage. [NIST AI 600-1 GenAI Profile (July 2024)](https://doi.org/10.6028/NIST.AI.600-1) risk names used in the category column. Re-verify before lock.

Govern: owner is Engineering. Review this register each release and after any incident. Changes go through a Change Record.

| Risk ID | Risk | RMF function | GenAI category | Severity | Likelihood | Mitigation / control | Eval | Owner | Status |
|---------|------|--------------|----------------|----------|------------|----------------------|------|-------|--------|
| AIA-R1 | Silent passthrough shipped as ML | Map / Manage | Information Integrity | High | High today | SDD-8.1-01. Production MUST NOT register the mock. | QAD-F14-A4 | Eng | Open |
| AIA-R2 | SPA chroma-key treated as the model | Map / Manage | Information Integrity | Med | High today | SDD-8.1-02. Demote or delete `processBackgroundRemoval`. | QAD-F14-A2, fail-today note | Eng | Open |
| AIA-R3 | Vendor key in SPA or git | Manage | Information Security | High | Med | SDD-8.1-03. Railway only. | QAD-F14-A2 | Eng | Open |
| AIA-R4 | Poisoned or huge upload | Measure / Manage | Information Security | Med | Med | SDD-8.1-04. Size and type at API boundary. | QAD-F14-A1 | Eng | Open |
| AIA-R5 | PII or faces in catalog photos sent to a foreign vendor | Map / Manage | Data Privacy | Med | Med | SDD-8.1-05. Catalog-only path. CLR sub-processor. Counsel if people are routine. | CLR launch gate | Eng + counsel | Open |
| AIA-R6 | Damage photos enter the cutout pipeline | Map / Manage | Data Privacy | Med | Low | SDD-8.1-06. Separate endpoints. | QAD-F14-A3 | Eng | Open |
| AIA-R7 | Vendor down, fake success | Measure / Manage | Confabulation | Med | Med | SDD-8.1-07. Store original, log, no cutout claim. | QAD-F14-S | Eng | Open |

Prompt-injection as a text attack is N/A unless a promptable API is locked. Image bytes stay data.

No row stays Open at launch without an escalation flag in §4. AIA-R1, R2, R3 must be Mitigated before production catalog ingest. AIA-R5 stays Open until counsel if people-in-frame is routine.

**Self-check:**

- [x] Every SDD §8.1 control has a row
- [x] Each row names an owner and a status
- [x] GenAI category column filled against NIST AI 600-1 list dated 2026-09-12

## 3. SMACTR self-audit

| Stage | What it produces here | Done? | Evidence link |
|-------|-----------------------|-------|---------------|
| Scoping | Intended use, prohibited use, provisional class | yes (Draft) | §0, §1.1 |
| Mapping | Boundary and trust boundary | yes (Draft) | SDD §8 |
| Artifact collection | Card, register, RFC | yes (Draft) | §1, §2, rfc-lumiere-bg-removal.md |
| Testing | Red-team cases | specified, not run | QAD-F14-H/S/A1–A4 |
| Reflection | Residual risk and go/no-go | yes | this section and §4 |

**Residual-risk statement:** After the mock is gone, residual risk is vendor quality, vendor retention of catalog photos, and possible faces in warehouse shots. That is acceptable for an internal technical ship only if CLR sub-processor terms are filled and AIA-R5 is Accepted or escalated. It is not acceptable while AIA-R1 remains Open.

**Go / no-go:** no-go for production catalog ingest until AIA-R1, R2, and R3 are Mitigated and QAD-F14 cases pass against Railway, not against the mock.

**Self-check:**

- [x] Every stage points to a real artifact
- [x] Testing maps to QAD-F14 ids
- [x] Reflection states a go/no-go

## 4. Cross-links and escalation

| Dimension | Lives in | This AIA relies on |
|-----------|----------|--------------------|
| AI architecture and threat surface | SDD §8 / §8.1 | SDD-8.1-01..07 |
| Red-team and abuse evals | QAD PRD-F14 | QAD-F14-H, S, A1–A4 |
| Data, sub-processors, legal | CLR | catalog photo row, vendor key, launch gate |
| Context hygiene | [AGENTS.md](../AGENTS.md) | Do not treat git-history writeups as the model contract |

### Escalation flags

| Flag | Present? | Why it escalates |
|------|----------|------------------|
| Output affects a person's rights, access, credit, employment, or benefits | No | Cutout is cosmetic for a catalog card. |
| Automated decision with legal or similarly significant effect, no meaningful human review | No | Operator can replace the photo. |
| Health, safety, biometric, or other sensitive inference | No for intended use | No face match, no GPS on this path. |
| General-purpose model placed on the market / systemic-risk scale | No | We consume a vendor. We do not place a GPAI on the market. |
| Training or run-time data with unresolved provenance / licensing / consent | Yes until CLR filled | Catalog photos may include people. Vendor training-on-inputs unknown until RFC lock. |
| Deployment in a market whose AI-specific rules are not yet mapped | No for PH-first ops | PH NPC 2024-04 and NAIS-PH noted in §5 as awareness. EU users not in scope this cycle. |

**If any flag is Yes:** pause sending real catalog photos to the vendor. Fill CLR sub-processor terms. Obtain counsel if people-in-frame is expected. Keep the AIA banner.

**Self-check:**

- [x] Cross-links point at real sections
- [x] Yes flag has a named action and the banner stays set

## 5. Regulatory awareness (PH-first, then global)

Awareness only. Not legal advice. Specifics verified 2026-09-12 against public NIST pages. PH instruments cited by identifier; confirm with a licensed Philippine attorney before launch.

| Regime | Applies? | What it asks (awareness) | Our note / action |
|--------|----------|--------------------------|-------------------|
| PH: NPC Advisory 2024-04 | Yes if personal data in photos | Lawful basis, transparency, accountability across the AI lifecycle | Catalog photos of objects. If faces appear, treat as personal data. Counsel. |
| PH: NAIS-PH ethics pillar | Awareness | Fairness, accountability, transparency, human oversight | HITL on the asset card. |
| NIST AI RMF + GenAI Profile | Yes (voluntary) | Govern/Map/Measure/Manage. §2 is organized to it. | NIST AI 100-1 (2023), NIST AI 600-1 (2024). |
| ISO/IEC 42001 | No this cycle | Auditable AI management system | Awareness only. No certification claim. |
| EU AI Act | No this cycle | Risk-tiered duties if EU market | No EU users in this technical build. Revisit if the SPA is offered there. |

**Self-check:**

- [x] §0 markets match regimes marked here
- [x] In-scope regimes have a note
- [x] NIST specifics dated 2026-09-12

## Self-Check

- [x] Component traces to PRD §7 / SDD §8
- [x] §1 states intended use AND limits
- [x] §2 maps SDD §8.1 to QAD evals
- [x] §3 Testing maps to QAD-F14
- [x] §4 Yes flag has an action. Banner stays.
- [x] Does not certify or audit
- [x] No public `MODEL_CARD.md` this cycle (feature not advertised)
