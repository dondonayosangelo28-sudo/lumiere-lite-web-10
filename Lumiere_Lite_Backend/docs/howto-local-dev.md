# How to run the API locally

You will have the API on port 8080. Login from a local SPA on 5173 can work against this process. That is not a production deploy.

## Prerequisites

- .NET SDK 10.0.103 (see `global.json`) and the `dotnet` CLI
- Optional: Postgres on `127.0.0.1:5432` database `lumiere_db`. If the API cannot open that connection, it currently falls back to InMemory and still seeds demo users. Data will vanish on restart.
- Optional: `supabase` CLI linked to the project for status and Storage inspection. Do not apply `supabase/migrations` at runtime. EF owns schema.

## Steps

1. Run `dotnet restore Lumiere.slnx` then `dotnet run --project Lumiere.API/Lumiere.API.csproj`.
2. Confirm the console mapped `POST /api/auth/login`.
3. Clone Shunrenn/Lumiere-UI separately if you need the SPA. Run `pnpm install` and `pnpm dev` there. Open `http://localhost:5173`. Sign in with a seeded email such as `warehouseops@lumiere.com` and password `lumiere2026`.

## Verification

`POST http://localhost:8080/api/auth/login` with JSON `{"email":"admin@lumiere.com","password":"lumiere2026"}` returns a token.

## Troubleshooting

- Empty warehouse after refresh in the SPA: Create Event is still in-memory on the UI. Expected until the API is wired.
- Postgres down: API still starts. Do not trust that as persistence.
- Do not use `nixpacks.toml`. Restore `Lumiere.slnx`.
