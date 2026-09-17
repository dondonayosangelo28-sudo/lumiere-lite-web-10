# Build Guide

**Project:** Lumiere
**Date:** 2026-09-12
**Version:** 0.1
**Owner:** Lumiere team
**Status:** Locked
**Last reconciled:** 2026-09-13
**PRD:** [prd-lumiere.md](prd-lumiere.md)
**SDD:** [sdd-lumiere.md](sdd-lumiere.md)
**SAD:** [sad-lumiere.md](sad-lumiere.md)
**AIA:** [aia-lumiere.md](aia-lumiere.md)

How to work in this API repository. Canonical copy. Materialized to repo-root `AGENTS.md`. Edit this file, then re-copy.

## 1. How to build from these docs

Read in this order before writing code:

1. `docs/index.md`
2. `docs/state.md`
3. PRD
4. SDD
5. RFC for the slice (`rfc-lumiere-deploy.md`, `rfc-lumiere-bg-removal.md`)
6. DSD in Lumiere-UI if the change is visual
7. QAD before claiming done
8. CLR if data or deploy
9. AIA if the change touches PRD-F14
10. This guide

Docs in this folder are Draft until a human locks them. Do not guess around a Draft RFC for deploy or removal. Flag it.

**Re-ground:** session start, after a Change Record, after a long search when prior agent output is unverified.

| To implement | Read | Verify |
|--------------|------|--------|
| PRD-F# | PRD §3/§4 → SDD components → RFC if any | QAD for that ID |
| Schema | SDD §3 | migrations in Infrastructure |
| API endpoint | SDD §4, contracts-fe-be.md | QAD sad/abuse |
| Catalog cutout | PRD §7, SDD §8, rfc-lumiere-bg-removal.md, aia-lumiere.md | QAD-F14 |
| SPA origin | PRD-F15, rfc-lumiere-deploy.md | QAD-F15 |

## 2. Subagents

Roster: `docs/sad-lumiere.md`. Materialized Cursor rules under `.cursor/rules/` (SPA wire lives in Lumiere-UI). Spawn per SAD §4. No SAD card, do the work inline.

## 3. Layout and pins (verify dates 2026-09-12)

This repo is the ASP.NET Core 10 API (default branch `dev`). The Vite SPA is Shunrenn/Lumiere-UI. Product docs for this repo live in `docs/`.

- .NET SDK 10.0.103 (`global.json`), rollForward latestFeature
- ASP.NET / EF / Npgsql 10.x as in csproj
- Node via pnpm. Vite ^6.0.7, React ^19.1.0, TypeScript ~5.7.2, Tailwind 4
- Konva ^10.3.1, react-konva ^19.2.5
- `@supabase/supabase-js` ^2.108.2 (SPA). `supabase-csharp` 0.16.2 (API)

## 4. Commands

API (from this repo):

\`\`\`
dotnet restore Lumiere.slnx
dotnet run --project Lumiere.API/Lumiere.API.csproj
\`\`\`

Listens `http://*:PORT` default 8080.

SPA (from Lumiere-UI):

\`\`\`
pnpm install
pnpm dev
\`\`\`

Vite 5173. Production SPA build: `pnpm build`.

## 5. Conventions

- New API rules go in Application services, not in controllers.
- Do not add a fourth data store.
- Do not hardcode `localhost:8080` in new UI code. Read `import.meta.env.VITE_API_URL`.
- Role strings must match `DbInitializer` names.
- Do not resurrect template WeatherForecast or empty Class1 files.
- Do not treat git-history writeups as requirements.
- Catalog cutouts go through `IBackgroundRemovalService`. Do not call a vision vendor from the SPA. Do not register the mock in Production.
- No AI attribution tags on commits, PRs, or file headers (Cursor, Claude, Codex, Antigravity, Copilot). Optional hook: `core.hooksPath .githooks`. Do not run `git config` from an agent unless a human asked.

## 5.2 Public surface

Public SPA URLs exist. When a hostname is advertised as production:

- No demo passwords on the login page.
- No anonymous `login-debug`.
- No JWT secret or removal vendor key in git or in Vercel.
- `robots.txt` / crawler policy: do not invite training crawlers onto authenticated warehouse data. Static marketing copy only if you later add it. Default for the app origin is noindex for authenticated routes.

## 6. Definition of done (first production slice)

- QAD Must-Have cases against Railway + Vercel, not against InMemory. Include F2, F4, F14.
- Secrets out of git.
- Create Event visible after refresh on a second browser.
- Mock `BackgroundRemovalService` not registered in Production.
- `GET /health` exists for Railway.

## 7. Tools, CLIs, and MCP

Use these for this stack (Vercel SPA, Railway API, Supabase Postgres). Do not pull in Gmail, Drive, Calendar, Stitch, or Cloudflare. Prefer a live CLI or authenticated MCP over inventing hostnames. Never dump secrets into docs or chat. Never put `Jwt__Secret` or `BackgroundRemoval__ApiKey` in Vercel env.

**CLIs**

- `dotnet` restore, run, test this repo
- `pnpm` install, dev, build in Lumiere-UI
- `gh` pull requests
- `railway` API deploy, logs, variables, rollback. There is no Railway MCP in Cursor. Use this CLI or the dashboard.
- `vercel` SPA deploy, env, logs (run from Lumiere-UI)
- `supabase` project link, status, Storage inspection. EF owns schema. Do not apply handwritten SQL under `supabase/migrations` at runtime.

Typical commands (after `railway link` / `vercel link` / `supabase link` in the right repo):

\`\`\`
railway logs
railway variables
railway up
vercel env ls
vercel logs
supabase status
gh pr create
\`\`\`

`GET /health` is the Railway probe target. It is not implemented yet.

**MCP (when authenticated)**

- Vercel MCP namespace `plugin-vercel-vercel`. If status is `needsAuth`, call `mcp_auth` first. Use it to inspect projects, env names, and deployments. Do not print secret values.
- Supabase MCP namespace `plugin-supabase-supabase`. Same auth pattern. Use it to inspect the project and tables. Do not treat MCP output as a schema migration. EF remains owner.

If an MCP server is unauthenticated, use the matching CLI instead of guessing.
