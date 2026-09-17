# Damage and deficit

**Project:** Lumiere
**Domain:** damage-deficit
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F8

## Purpose

Field damage and missing items become rows that can block settlement. Deficits feed replenishment.

## As-built

- API: `DamageReportController` `POST /api/damage-reports`, sign-off, `admin-unblock` (Admin), complete-maintenance, settlement-blocked query.
- `DeficitQueueController` is `[Authorize]` only.
- SPA `damageApi.ts` uses `http://localhost:8080/api/damage-reports`. Many UI ids collapse to demo GUID `11111111-…`.
- Ground crew `submitGroundCrewDeclaration()` writes `ground-crew-declarations.ts` memory. It does not POST the API.
- `store.tsx` polls damage every 3s against localhost and falls back to seed.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `DamageVerdict` in `types.ts` | `DamageVerdict` constants | GET/sign-off | yes, strings match |
| `Partial<DamageException>` (`boundEvent`, `imageUrl`, `assetName`, `status`) | `CreateDamageReportRequest` (`assetId`, `eventId`, `photoUrl`, `sha256Hash`) | yes POST | no |
| `{ blocked, blockingItemsCount }` | `{ eventId, isSettlementBlocked }` | yes GET | no. `settleEvent` ignores the body. |
| `firstSignOff` as `DamageSignOff` object | JSON string on the DTO | GET | type lie |
| `DeficitStatus` `Not Purchased` \| `In Procurement` \| `Received` | `DeficitStatus` same three | no | strings match. PATCH also accepts `Resolved`. Ids `def-e-*` vs Guid. |

## Production SHALL

1. Crew submit SHALL `POST /api/damage-reports` with the API event GUID, `assetId`, `photoUrl`, and `sha256Hash`.
2. Validation screens SHALL list those rows, not a single demo GUID.
3. Dual-custody sign-off rules in `DamageReportService` SHALL remain the server authority.
4. Deficit create and list SHALL use API Guids. Status strings already match (`Not Purchased`, `In Procurement`, `Received`). Do not treat `Resolved` as a fourth UI status until the union includes it.
5. Production HTTPS pages SHALL NOT call localhost.

## Scenarios

**Crew file**
- GIVEN Ground Crew JWT and event GUID E
- WHEN POST damage with `assetId`, `eventId`, `photoUrl`, `sha256Hash`
- THEN GET for E returns that report id

**Settlement block**
- GIVEN an unsigned damage row on E
- WHEN settlement-blocked query
- THEN `isSettlementBlocked` is true
