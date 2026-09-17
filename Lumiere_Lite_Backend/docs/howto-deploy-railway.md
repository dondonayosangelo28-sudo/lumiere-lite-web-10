# How to deploy the API on Railway

You will run the ASP.NET API as a container on Railway, talking to one Supabase Postgres. Use the Dockerfile. Do not use nixpacks.

## Prerequisites

- Docker-capable Railway service
- Railway CLI (`railway login`, then `railway link` in this repo)
- A Supabase project with a Postgres URI (`supabase link` optional for inspection)
- JWT secret generated outside git (32+ bytes)

## Steps

1. Create a Railway service from this repository. Builder Dockerfile (`Dockerfile`). CLI: `railway up` after link, or the dashboard.
2. Set `ASPNETCORE_ENVIRONMENT=Production` (`railway variables` or dashboard).
3. Set `ConnectionStrings__DefaultConnection` to the Supabase Postgres URI (SSL as required by Supabase).
4. Set `Jwt__Secret`, `Jwt__Issuer=Lumiere.API`, `Jwt__Audience=Lumiere.Client`.
5. Set `Supabase__Url` and `Supabase__AnonKey` for Realtime/Storage.
6. Railway injects `PORT`. `Program.cs` already binds `http://*:{PORT}`.
7. After a health route exists, point Railway health at `GET /health`. Until then, `railway logs` and watch for "Database initialization".
8. Add the Vercel origin to CORS and redeploy.

There is no Railway MCP. Use this CLI. Supabase MCP may inspect tables when authenticated. EF still owns schema.

## Verification

`POST https://<railway>/api/auth/login` from a tool (and later from the Vercel page) returns JWT. `MigrateAsync` applied. Restarting the service still has users (Postgres, not InMemory).

## Troubleshooting

- Nixpacks build: `dotnet restore Lumiere.sln` fails because the repo has `Lumiere.slnx`. Switch the service to Dockerfile.
- Boot with empty data after a "successful" start: Postgres ping failed and InMemory was used. That must not happen in Production. Fix the connection string.
- 401 from the SPA: CORS origin mismatch or still calling localhost.
