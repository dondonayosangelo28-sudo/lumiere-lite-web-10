# Identity and RBAC

**Project:** Lumiere
**Domain:** identity-rbac
**Version:** 0.1
**Status:** Draft
**Last reconciled:** 2026-09-12
**PRD links:** PRD-F1, PRD-F2

This file is the identity contract. It restates what you need. You do not have to open the PRD first.

## Purpose

Authenticate staff, attach one role, authorize API calls, and map that role onto the SPA shells (web vs mobile portal).

## As-built

- Users and roles live in EF (`users`, `roles`) seeded by `Lumiere.Infrastructure/Data/DbInitializer.cs`. Demo password hash is BCrypt of `lumiere2026`.
- Login: `POST /api/auth/login` in `AuthController`. JWT from `JwtService` with claims `sub`, `jti`, `email`, `role_id`, `role_name`. Refresh is 501.
- SPA `Lumiere-UI/src/lib/auth.tsx` posts to `http://localhost:8080/api/auth/login` and stores `_lumiere_auth_user` / `_lumiere_auth_token` in `localStorage`.
- `mapBackendUserToPortalAccount` remaps `Warehouse Operations Manager` to UI role `Warehouse Manager` plus `fullWarehouseAccess`.
- `[RequireRole]` uses `RbacAuthorizationHandler`. Hierarchy array includes `SystemAdmin`, `Supervisor`, `WarehouseSupervisor`, `FrontOfficePlanner`, which are not the seeded names.
- `AssetController` create path reads claim type `"roles"`. JWT does not emit `"roles"`.
- When Supabase env is present, workforce screens also read/write `portal_accounts`. That is a second identity store.
- `POST /api/auth/login-debug` is anonymous and can return stack traces.
- `User.IsActive` is not checked on login.

Seeded roles: Admin, Executive, Event Planner, Warehouse Operations Manager, Warehouse Manager, Inventory Officer, Manning Officer, Production Manager, Purchasing Officer, Warehouse Lead, Warehouse Member, Ground Crew, Event Admin. Comment says 14. Insert count is 13. `SystemAdmin` is not seeded.

## Wire

| FE | BE | Live | Fit |
|----|----|------|-----|
| `{ email, password }` | `LoginRequest` | yes | yes |
| `{ token, fullName, email, userId, role }` | `AuthResponse` | yes | yes, then remapped |
| `PortalAccount.role` after WOM map | JWT `role_name` | after login | no. WOM becomes `Warehouse Manager`. |
| claim type `"roles"` on asset create | JWT emits `role_name` | n/a | no |
| `STAFF_ROLES` includes `Field & Production Crew` | not seeded | n/a | no |
| password change → `portal_accounts` | EF `users` | no API | second store |

Hierarchy in `RbacAuthorizationHandler` never matches a seeded role, so Admin does not inherit `Warehouse Operations Manager` on dispatch.

## Production SHALL

1. The system SHALL authenticate against the EF `users` table only.
2. The system SHALL emit JWT `role_name` equal to the seeded role string and SHALL authorize on that same string.
3. The SPA SHALL call `{VITE_API_URL}/api/auth/login` over HTTPS in deployed builds.
4. Production SHALL disable or protect `login-debug`.
5. Login SHALL reject inactive users.
6. The UI SHALL NOT persist a parallel password table for login.

## Scenarios

**Login local API**
- GIVEN seeded `warehouseops@lumiere.com` and a running API on 8080
- WHEN POST `/api/auth/login` with the demo password
- THEN 200 with token and `role` = `Warehouse Operations Manager`

**Login from Vercel**
- GIVEN `VITE_API_URL` is the Railway HTTPS origin
- WHEN the SPA submits the same credentials
- THEN a JWT is stored and Warehouse Home renders

**Inactive user**
- GIVEN `IsActive = false`
- WHEN login
- THEN 401 and no token
