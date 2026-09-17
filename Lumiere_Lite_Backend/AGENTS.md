# AGENTS.md

Materialized from [docs/build-lumiere.md](docs/build-lumiere.md). Edit the Build Guide, then re-copy this file. Do not treat this copy as the source of truth.

## Read first

1. [docs/index.md](docs/index.md)
2. [docs/state.md](docs/state.md)
3. [docs/prd-lumiere.md](docs/prd-lumiere.md)
4. [docs/sdd-lumiere.md](docs/sdd-lumiere.md)
5. RFC for the slice: [docs/rfc-lumiere-deploy.md](docs/rfc-lumiere-deploy.md), [docs/rfc-lumiere-bg-removal.md](docs/rfc-lumiere-bg-removal.md)
6. [docs/qad-lumiere.md](docs/qad-lumiere.md) before claiming done
7. [docs/aia-lumiere.md](docs/aia-lumiere.md) if the change touches PRD-F14
8. [docs/sad-lumiere.md](docs/sad-lumiere.md) for who to spawn

This is a technical production build. Do not write BRD, UES, GTM, PITCH, WRAP, OPP, or PROP.

## Subagents

Cursor rules materialized from the SAD:

- `.cursor/rules/sad-api-integrator.mdc`
- `.cursor/rules/sad-bg-removal.mdc`
- `.cursor/rules/sad-qad-runner.mdc`
- SPA wire: Lumiere-UI `.cursor/rules/sad-spa-production-wire.mdc`

## Guardrails

- One Postgres via EF. No fourth store. No InMemory in Production.
- SPA uses `VITE_API_URL`. No new `localhost:8080` hardcodes.
- Role strings match `DbInitializer`.
- Catalog cutouts: `IBackgroundRemovalService` only. No vendor key in the SPA. No mock in Production. Damage photos stay off this path.
- Do not treat git-history writeups as requirements.
- Compile is not QAD evidence.
- No AI attribution tags on commits, PRs, or file headers (Cursor, Claude, Codex, Antigravity, Copilot). Optional hook: `core.hooksPath .githooks`. Do not run `git config` from an agent unless a human asked.

## Public surface

When a hostname is advertised as production: no demo password on the login page, no anonymous `login-debug`, no secrets in git or Vercel. Do not invite training crawlers onto authenticated warehouse data.

## Commands

\`\`\`
dotnet restore Lumiere.slnx
dotnet run --project Lumiere.API/Lumiere.API.csproj
\`\`\`

Default port 8080.

Pins (2026-09-12): .NET SDK 10.0.103, ASP.NET / EF / Npgsql 10.x.

## Tools, CLIs, and MCP

Canonical detail: [docs/build-lumiere.md](docs/build-lumiere.md) §7. This stack is Vercel + Railway + Supabase only.

- `dotnet`, `pnpm`, `gh`
- `railway` for API logs, variables, deploy, rollback (no Railway MCP)
- `vercel` from Lumiere-UI for SPA env and logs
- `supabase` for link/status/Storage. Do not apply `supabase/migrations` at runtime. EF owns schema.
- Vercel MCP `plugin-vercel-vercel` and Supabase MCP `plugin-supabase-supabase` when authenticated (`mcp_auth` if `needsAuth`). Prefer them over inventing hostnames. Never dump secrets. Never put JWT or `BackgroundRemoval__ApiKey` in Vercel env.
