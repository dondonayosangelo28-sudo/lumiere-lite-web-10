# Operations Runbook (OPS)

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13

Target runbook for Vercel + Railway + Supabase Postgres. **Not running today.** Local InMemory boots are not this environment.

## 1. Services

| Service | Platform | Image / build |
|---------|----------|----------------|
| SPA | Vercel | `pnpm build` in `Lumiere-UI` |
| API | Railway | `Dockerfile` → `Lumiere.API.dll` |
| Postgres | Supabase | EF migrations at API boot |
| Realtime / Storage | same Supabase project | API client |

Do not start the API with nixpacks (`dotnet restore Lumiere.sln` will fail).

## 2. Health and SLOs (target)

- `GET /health` and `GET /api/health` (Implemented). Railway probe endpoint. Returns 200 when process is up and Postgres ping succeeds. Returns 503 if Postgres is unreachable or if InMemory database is active.
- Availability SLO: 99% monthly for the API after first real users. Error budget discussion starts then, not before login works.
- Login from Vercel origin is the user-visible SLI.
- Catalog cutout is not an SLO until F14 ships. Vendor timeout SHALL NOT take down login. Cap the removal HTTP client (recommend 15s).

## 3. Configuration

Railway:
- `PORT` (platform)
- `ASPNETCORE_ENVIRONMENT=Production`
- `ConnectionStrings__DefaultConnection`
- `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`
- `Supabase__Url`, `Supabase__AnonKey` (and service role only if Storage writes need it, never in the SPA)
- `BackgroundRemoval__ApiKey`, `BackgroundRemoval__Endpoint` (never in Vercel)

Vercel:
- `VITE_API_URL=https://<railway-host>`

Production database seeds roles only, no demo accounts or demo passwords (lumiere2026 must not exist in Production; Decision D8). Production SHALL exit if Postgres is unreachable. No InMemory.

## 4. Deploy / rollback

- API: Railway deploy from `dev` (or a release branch). CLI: `railway up` after `railway link`. Rollback = previous Railway deployment (`railway rollback` or the dashboard).
- SPA: Vercel production deploy from `main`. CLI from Lumiere-UI: `vercel --prod`. Rollback = previous Vercel deployment (`vercel rollback` or the dashboard).
- Logs: `railway logs`. SPA: `vercel logs`.
- Vars: `railway variables` for JWT, connection string, removal key. `vercel env` for `VITE_API_URL` only. Never JWT or `BackgroundRemoval__ApiKey` on Vercel.
- Inspect hosts via Vercel MCP or Supabase MCP when authenticated. There is no Railway MCP. Use the CLI.
- Migrations: forward-only. Test `MigrateAsync` against a staging Supabase branch first. Do not apply handwritten `supabase/migrations` at runtime.

## 5. Incidents

- P0: login 5xx or TLS mismatch (mixed content). Check `VITE_API_URL`, CORS, `railway logs`.
- P0: data loss. If InMemory was used, treat data as gone. Restore from Supabase backup only if Postgres was actually the store.
- Sev notes go to a postmortem file when a P0/P1 happens. None yet.

## 6. Secrets rotation

Rotate `Jwt__Secret` by setting a new Railway secret and forcing re-login (old tokens invalid). Token blacklist is process-local today.

## 7. Appendix: GCP promotion

Move the same Dockerfile to Cloud Run when: CI is green, health exists, secrets are not in git, Vercel↔API login works, and Railway limits (region, replicas, cost) hurt. Database can stay Supabase Postgres. Do not add Cloud SQL as a second Postgres.

## 8. Related (optional)

`rfc-lumiere-deploy.md`, `rfc-lumiere-bg-removal.md`, `howto-deploy-railway.md`, `howto-deploy-vercel.md`.
