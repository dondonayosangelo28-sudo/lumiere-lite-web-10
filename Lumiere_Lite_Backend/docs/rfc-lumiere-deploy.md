# RFC: System of record and first-ship deploy

**Project:** Lumiere
**ID:** rfc-lumiere-deploy
**Date:** 2026-09-12
**Version:** 0.1
**Status:** Locked
**Last reconciled:** 2026-09-13

This file is the deploy and data-store decision. It is readable alone. Locked decision record.

## 1. Problem

The SPA and the API do not share one write path. Login and damage point at `http://localhost:8080`. Events live in React memory. Users exist in EF and, optionally, in browser Supabase. Deployments exist in Neon. The API can boot InMemory if Postgres is down. A Docker + Vercel "deploy" with that wiring is a login screen.

The frontend belongs on Vercel. The API is ASP.NET Core 10 with JWT, EF, and two `BackgroundService` workers. It is a long-running process.

## 2. Decision (first ship)

**Vercel** hosts the Vite SPA. Canonical production origin: `https://lumieredemo-seven.vercel.app` (confirmed).

**Railway** runs `Dockerfile` (not `nixpacks.toml`). `Program.cs` already binds `PORT` (default 8080).

**One Supabase Postgres** is the system of record. EF Core owns schema via `MigrateAsync`. Supabase Realtime (`asset-transitions`) and Storage (`assets`) stay as add-ons the C# client already uses.

**Retire from target:** Neon `DATABASE_URL` / `api/deployments.ts`. Browser `portal_accounts` as login identity. Silent InMemory in Production. JWT secret in `appsettings.json`.

**Promote later, not now:** GCP Cloud Run + Secret Manager, once CI, healthchecks, and the Vercel↔Railway wire work.

## 3. Why this wins

- The Dockerfile already publishes `Lumiere.API`. Nixpacks restores `Lumiere.sln`, which is not in the repo (`Lumiere.slnx` is). Docker on Railway is the builder that matches the tree.
- Supabase is already referenced from both apps. Using it as hosted Postgres plus Realtime/Storage avoids a third database. Neon is a second Postgres for one function.
- GCP Cloud Run is a valid container host. First ship while login is localhost is IAM and VPC with no product loop.

## 4. Rejected for first ship

| Option | Why not first |
|--------|----------------|
| Vercel for the API | Workers, EF, Kestrel, in-memory blacklist. Not a serverless fit. |
| Railway nixpacks | Wrong sln filename. |
| GCP Cloud Run first | Extra ops. Same container can move later. |
| Railway + Neon only | Drops Realtime/Storage the services already call. |
| Two Postgreses | The failure mode we already have. |
| Azure Container Apps | Best native ASP.NET host. Not requested. Revisit if Railway is forbidden. |

## 5. Consequences

SPA:
- `VITE_API_URL` for auth and damage (and later events, reservations, dispatch).
- CORS origin list includes the production Vercel origin: `https://lumieredemo-seven.vercel.app`.
- Production build SHALL NOT fall back to localhost.

API:
- `ConnectionStrings__DefaultConnection` = Supabase Postgres URI.
- `Jwt__Secret` from Railway secrets.
- `Supabase__Url` / `Supabase__AnonKey` (or service role only on the server, never in the SPA) as needed for Realtime/Storage.
- If `ASPNETCORE_ENVIRONMENT=Production` and Postgres ping fails, process exits. No InMemory.
- Seed demo users only in Development.

Schema:
- Do not apply `supabase/migrations/*.sql` onto the hosted DB. Column names conflict with EF.
- Point EF at the Supabase DB and migrate forward.

Deployments module:
- Replace `api/deployments.ts` with an ASP.NET controller on the same Postgres, or drop the screen until then.

## 6. Rollout

1. Railway service from Dockerfile. Health endpoint. Secrets set.
2. Vercel env `VITE_API_URL`. Rebuild.
3. CORS update. Prove login from the Vercel origin.
4. Then wire Create Event.

Rollback: Railway previous deploy. Vercel previous deployment. No dual-write period.

## 7. Open

None. Canonical production hostname (`lumieredemo-seven.vercel.app`) and production seed strategy (roles only, no demo passwords; Decision D8) are locked.

Catalog cutout provider is locked in separate RFC: `rfc-lumiere-bg-removal.md`.
