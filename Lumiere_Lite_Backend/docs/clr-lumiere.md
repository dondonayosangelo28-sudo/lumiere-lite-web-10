# Compliance and Legal Readiness (CLR)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13

This is a register, not legal advice. Counsel before a public launch with real staff data.

## 1. Data inventory (as-built)

| Data | Where | Purpose |
|------|-------|---------|
| Email, full name, password hash | EF `users` | Login |
| Role | EF `roles` | Authorization |
| JWT | Browser `localStorage`, API | Session |
| Confirmation PIN | May sit plaintext on the auth object in `localStorage` | Step-up |
| Event metadata, venues, dates | EF `events` and/or React memory | Planning |
| Asset catalog, photos | EF + intended Supabase Storage | Stock |
| Catalog photo bytes sent to vision vendor (target) | `IBackgroundRemovalService` → remove.bg or locked alternative | PRD-F14 cutout. Not damage photos. |
| Damage descriptions, photos, optional GPS | Intended `damage_reports`; crew UI memory today | Field reports |
| Audit rows | EF `AuditLogService`; also browser `audit_logs` when Supabase env set | Governance |

## 2. Current defects that are compliance-relevant

- JWT signing secret committed in `Lumiere.API/appsettings.json`.
- Demo accounts and password `lumiere2026` seeded on every boot, including a Production boot that reaches Postgres.
- Anonymous `login-debug` can leak stack traces.
- PIN may be stored recoverable in `localStorage`.
- Damage photos and GPS are personal/location-adjacent. Retention not defined.
- Catalog photos will leave the API to a vision vendor. People in frame are possible. No sub-processor contract on file yet.

## 3. Target controls

- Secrets only in Railway (and Vercel for `VITE_API_URL`, never the JWT secret in the SPA). Removal vendor key never in Vercel.
- Production seed: roles only, no demo accounts or demo passwords (lumiere2026 must not exist in Production; Decision D8).
- Retention: damage photos and GPS kept for a named window, then deleted. Write the number before first real event.
- Retention: catalog originals vs cutouts. If originals are discarded after a successful cutout, say so in the RFC. If kept, apply the same named window.
- Sub-processor: vision vendor (default remove.bg, or the locked alternative). Record region and whether inputs train the vendor model before first real catalog photo.
- Privacy notice if any non-employee uses the SPA.
- No children's data. No payments. If GPS stays, treat as sensitive (signal S10-adjacent) and minimize (opt-in, coarse).
- Catalog photos are objects, not IDs. If warehouse shots routinely include identifiable people, escalate to counsel before sending them to a US/EU vendor (AIA §4).

## 4. IP / branding

UI uses "Lumière". Confirm trademark before a public marketing domain.

## 5. Launch gate

Do not put real staff passwords in a database that still seeds `lumiere2026` on startup (enforced by Decision D8: Production database seeds roles only, no demo accounts or demo passwords).

Do not send catalog photos to a vision vendor until the sub-processor row is filled (`rfc-lumiere-bg-removal.md` is Locked with remove.bg as confirmed vendor pick).
