# CLAUDE.md

Guidance for working in this repository. See `README.md` for full setup/run docs; this file
captures the architecture and conventions that aren't obvious from a single file.

## What this is

Full-stack CMS scaffolded from an existing SQL Server schema (`./auth.sql`, `./course.sql`,
`./promotion.sql`). The DB is the source of truth — models mirror existing tables; there are no
migrations and no EF.

- **Backend** — `src/CMS.API` — .NET 9 Web API, Dapper (raw SQL, async), Swagger.
- **Backend tests** — `src/CMS.API.Tests` — xUnit against in-memory fakes (no live DB needed).
- **Frontend** — `src/CMS.NG` — Angular 20 (standalone components) + PrimeNG.

First and currently only feature: **CRUD AppRole** (`系統管理 Admin ▸ 角色 AppRole`), including the
AppRole ↔ AppUser many-to-many assignment via the `AppUserRole` table.

## Commands

```bash
# Backend (http://localhost:5000, Swagger at /swagger)
cd src/CMS.API && dotnet run

# Backend tests
cd src && dotnet test

# Frontend (http://localhost:4200)
cd src/CMS.NG && npm install   # first time
cd src/CMS.NG && npm start

# Frontend tests (Karma + Jasmine)
cd src/CMS.NG && npm test
```

Prereqs: .NET SDK 9 (pinned in `src/global.json`), Node + Angular CLI 20, and a SQL Server `CMS`
database built from the root `.sql` scripts. Solution file: `src/CMS.sln`.

## Backend architecture & conventions

Request flow: **Controller → Repository (interface) → `IDbConnectionFactory` → Dapper**.

- DI wiring lives in `src/CMS.API/Program.cs`: repositories are `Scoped`, the connection factory is
  `Singleton`. Register new repositories there.
- Connection string is `ConnectionStrings:CMS` in `appsettings.json`. Open connections only via
  `IDbConnectionFactory.Create()` — don't `new` a `SqlConnection`.
- Repositories return domain models from `Models/`; controllers accept `*Request` / `*Query` DTOs.
- SQL is written by hand with Dapper and parameterized (`@Param`) — never string-concatenate user
  input. See `AppRoleRepository` for the house style: shared `SelectColumns`/`OrderBy` consts,
  `QuerySingleOrDefaultAsync` for single rows, explicit `AS` aliases mapping columns to model props.
- Multi-row writes that must be atomic open the connection, `BeginTransaction()`, and pass the `tx`
  to every `ExecuteAsync`. Many-to-many links use **delete-then-reinsert** on that transaction
  (`SyncUsersAsync`).
- CORS is open to any `localhost` origin (dev only), configured in `Program.cs`.
- `Program` is declared `public partial` so test `WebApplicationFactory` can reference the entry
  point.

## Frontend architecture & conventions

- Standalone components (no NgModules). Feature code lives under `src/app/features/<feature>/`;
  shared models under `src/app/core/models/`.
- One service per feature owns the HTTP contract (`AppRoleService`) using `inject(HttpClient)` and
  returning `Observable`s. API base URL comes from `src/environments/environment*.ts` — there is
  **no** dev-server proxy.
- Path aliases (in `tsconfig.json`): `@env`, `@core/*`, `@features/*`, `@app/*`. Prefer these over
  long relative imports.
- Prettier config is in `package.json`: 100 col, single quotes.

## Gotchas

- **`AppRole`'s primary key is the string `RoleId`, not an int.** API routes use `{id}` with no
  `:int` constraint, and the Angular service `encodeURIComponent`s the id in URLs. Keep this in mind
  for any new string-keyed entities.
- Tests run without a database: backend uses `FakeAppRoleRepository`, so don't add tests that require
  a live SQL Server to the unit suite.
- The root `.sql` files are the schema of record — when adding a feature, model the existing table
  rather than inventing columns.

## Git / build hygiene

- `.NET` build output (`bin/`, `obj/`) is git-ignored at the repo root; `node_modules`/`dist` are
  ignored by `src/CMS.NG/.gitignore`. Don't commit build artifacts.
