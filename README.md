# CMS

Full-stack CMS scaffolded from the existing SQL Server schema in `./*.sql`.

- **Backend** — `src/CMS.API` — .NET 9 Web API, Dapper (no EF), async, Swagger.
- **Backend tests** — `src/CMS.API.Tests` — xUnit.
- **Frontend** — `src/CMS.NG` — Angular 20 (standalone) + PrimeNG.

First feature: **CRUD AppRole** (`系統管理 Admin ▸ 角色 AppRole`) — list with query filter, view, add, edit,
including the AppRole ↔ AppUser (`AppUserRole`) many-to-many user assignment.

## Prerequisites

- .NET SDK 9 (pinned via `src/global.json`)
- Node.js + npm, Angular CLI 20
- SQL Server with the `CMS` database created from the scripts at the repo root
  (`auth.sql`, `course.sql`, `promotion.sql`)

## Backend — CMS.API

```bash
cd src/CMS.API
dotnet run
```

- Runs at **http://localhost:5000**
- Swagger UI: **http://localhost:5000/swagger**
- CORS is open to any `localhost` origin (the Angular dev server on :4200).
- Connection string lives in `src/CMS.API/appsettings.json` (`ConnectionStrings:CMS`):
  `Server=.\SQLEXPRESS;Database=CMS;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False`

### API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/app-roles`        | List all roles |
| POST   | `/api/app-roles/query`  | Filtered search (`keyword`, `permissionLevel`) |
| GET    | `/api/app-roles/{id}`   | Get one role by `RoleId` (includes assigned `userIds`) |
| POST   | `/api/app-roles`        | Create |
| PUT    | `/api/app-roles`        | Update (`RoleId` in body) |
| DELETE | `/api/app-roles/{id}`   | Delete |
| GET    | `/api/lookups/app-users`| Slim AppUser list for the user multi-select |

> `AppRole`'s primary key is the string `RoleId`, so routes use `{id}` (no `:int` constraint)
> and the Angular service `encodeURIComponent`s it.

### Backend tests

```bash
cd src
dotnet test
```

`AppRolesControllerTests` cover list, query/filter, view, add, and edit against an in-memory
`FakeAppRoleRepository`, so they run without a live database.

## Frontend — CMS.NG

```bash
cd src/CMS.NG
npm install       # first time only
npm start         # ng serve on http://localhost:4200
```

- API base URL comes from `src/environments/environment*.ts` (no dev-server proxy).
- Path shorthands are configured in `tsconfig.json`: `@env`, `@core/*`, `@features/*`, `@app/*`.

### Frontend tests

```bash
cd src/CMS.NG
npm test          # ng test — Karma + Jasmine
```

Specs cover the `AppRoleService` (HTTP contract) and the list / form / detail components.
```

## Project layout

```
src/
  CMS.API/
    Controllers/     AppRolesController, LookupsController
    Data/            IDbConnectionFactory, SqlConnectionFactory
    Models/          AppRole, AppRoleRequest, AppRoleQuery, AppUserLookup
    Repositories/    AppRoleRepository (Dapper), LookupRepository
  CMS.API.Tests/     AppRolesControllerTests, Fakes/FakeAppRoleRepository
  CMS.NG/
    src/app/
      core/models/                 app-role.model.ts
      features/app-roles/          service + app-role-list / -form / -detail
```
