---
name: create-api-controller
description: Use when creating a new HTTP controller under src/app/api/controllers/. Fetches OpenAPI spec from Swagger, extracts endpoints for the specified resource, generates all files (dtos, interfaces, services, index, README) following the project's api/controllers pattern.
---

# Create API Controller

Generates a complete `api/controllers/<resource>/` module from a Swagger/OpenAPI spec.

## Step 1: Clarify inputs

Collect before proceeding:
- **Swagger URL** — HTML or JSON. If HTML (contains `/index.html`), derive JSON URL: replace `swagger/index.html?urls.primaryName=<Name>` with `swagger/<name-lowercase>/swagger.json`. Example: `?urls.primaryName=Front` → `/swagger/front/swagger.json`.
- **Resource name** — e.g. `categories`, `users`. If the user hasn't specified, fetch the spec and list available tag groups, then ask.

Fetch the OpenAPI JSON spec using the `fetch` MCP tool.

## Step 2: Extract from spec

From the JSON spec, for the chosen resource (matched by `tags` on each path operation):
1. **Endpoints** — method, path, summary, operationId
2. **Query params** (GET operations) — name, type, required
3. **Request body schemas** (POST/PUT/PATCH) — `$ref` resolved to properties
4. **Response schemas** — `200`/`201` response `$ref` resolved to properties
5. **Nested `$ref`** — resolve all `$ref` chains from `components/schemas`

See [references/openapi-mapping.md](references/openapi-mapping.md) for type mapping rules and DTO vs domain model decision.

## Step 3: Plan files

Before writing, list every file to create:
```
src/app/api/controllers/<resource>/
  dtos/                          # only if response shape ≠ domain model
    <resource>-list-response-dto.interface.ts
    create-<resource>-dto.interface.ts
    update-<resource>-dto.interface.ts
  interfaces/
    <resource>.interface.ts
    <resource>-search-params.interface.ts   # if GET list has query params
    <other-params>.interface.ts
  services/
    <resource>-api/
      <resource>-api.service.ts
    <resource>/
      <resource>.service.ts
  index.ts
  README.md
```

Drop `dtos/` entirely if server response = domain model (identical fields). Merge small interfaces into one file if they're closely related.

## Step 4: Generate files

Follow patterns in [references/file-templates.md](references/file-templates.md) exactly.

**Naming rules:**
- Interfaces: `I`-prefix, `PascalCase` → `ICategory`
- Files: `kebab-case` → `category.interface.ts`
- Services: `<Resource>ApiService` (raw), `<Resource>Service` (public)
- All class members need explicit access modifiers (`public` / `private`)
- `readonly` on injected services and constants

**Import rules:**
- `import { inject, Injectable } from '@angular/core'`
- `import { Observable } from 'rxjs'`
- `import { ApiService } from '@api/core'`
- `import type { IFoo } from '../../interfaces/foo.interface'` — type-only imports
- Use `map` from `'rxjs/operators'` for response mapping in public service

## Step 5: Verify

```bash
npx tsc --noEmit          # zero type errors
npm run lint              # zero ESLint errors
```

Fix all errors before reporting done. Common issues:
- Missing `readonly` on class fields
- Missing explicit return type on service methods
- Floating `Observable` — methods must declare `Observable<T>` return type
- `any` forbidden — resolve all `$ref` to concrete types

## Step 6: Report

Output a summary table:

| File | Status |
|------|--------|
| `interfaces/<resource>.interface.ts` | ✓ created |
| `services/<resource>-api/<resource>-api.service.ts` | ✓ created |
| ... | ... |

Note: `@api/<resource>` alias resolves automatically via the wildcard `"@api/*": ["src/app/api/controllers/*/index.ts"]` in both `tsconfig.app.json` and `tsconfig.spec.json` — no manual alias registration needed.
