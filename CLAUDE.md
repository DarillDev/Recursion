# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm test           # run all tests (Vitest)
npm run lint       # ESLint check
```

Run a single test file:
```bash
npx ng test --include="src/app/some.spec.ts"
```

## Docs

**`docs/`** — project documentation, feature specs, and implementation plans.

- [docs/categories-spec.md](docs/categories-spec.md) — specification for the Categories directory feature (CRUD, API endpoints, Figma links, auth flow)

Before implementing any feature, check `docs/` for an existing spec. New feature specs and implementation plans go here too.

## Project Structure

```
src/
  app/
    core/          # shared infrastructure modules (app-environment, guards, interceptors)
    layouts/       # wrapper components: public/ (unauthenticated) and internal/ (sidebar + auth)
    features/      # all business features
  ui-kit/          # reusable UI components with no business logic
```

### Core modules

Each module under `core/` follows the same layer structure as features, with `config/` instead of `pages/`:

| Layer | Purpose |
|---|---|
| `config/` | Angular providers (`provideX`) for DI registration |
| `interfaces/` | TypeScript interfaces (`I`-prefix) |
| `mappers/` | Data transformation (DTO → domain model) |
| `models/` | Domain model classes |

Each `core/` module exports everything through a barrel `index.ts`. Import via path alias:

```ts
import { AppEnvironment, provideAppEnvironment } from '@core/app-env';
```

Currently registered aliases (defined in `tsconfig.app.json` and `tsconfig.spec.json`):

| Alias | Module |
|---|---|
| `@core/app-env` | `src/app/core/app-environment/` |

When adding a new alias, register it in both `tsconfig.app.json` and `tsconfig.spec.json`. Both require `"baseUrl": "."` for `paths` to resolve correctly.

### Feature layer rules

Every feature under `features/` must follow this layer structure:

| Layer | Purpose |
|---|---|
| `pages/` | Routable components — one per route, placed directly in the router |
| `components/` | Child components and dialogs used within the feature |
| `services/` | Any services: HTTP calls, signals store, utilities |
| `models/interfaces/` | TypeScript interfaces (`I`-prefix) |
| `models/types/` | Type aliases (`T`-prefix) |
| `models/enums/` | Enums (`E`-prefix) |
| `constants/` | Feature-level constants |

Never put HTTP logic in components. Never put UI state in services (keep it in the page component as signals).

### Layouts

- **`layouts/public/`** — renders `<router-outlet>` only, no visual chrome. Used for unauthenticated routes (`/login`).
- **`layouts/internal/`** — collapsible sidebar (icon nav + user/logout at bottom) + `<router-outlet>`. Protected by `authGuard`. Contains `components/sidebar/`.

### Routing

```
/login         → PublicLayout  → features/auth/pages/login
/categories    → InternalLayout (authGuard) → features/categories/pages/categories-list
/              → redirect → /categories
```

### UI

- No UI component library — all components are built from scratch to match Figma designs.
- Shared primitives (table, dialog, form-field, search-input) live in `ui-kit/`.
- Add/Edit/Delete actions open as modal dialogs — no separate routes for them.

## Architecture

Angular 21 standalone application. Entry point: `src/main.ts` → `app.config-resolver.ts` → `app.routes.ts`.

**Bootstrap strategy (`main.ts`):** `environment.json` (fetch) and `app.config-resolver` (dynamic `import()`) are loaded in parallel via `Promise.all`. The resolver is a separate lazy chunk — a static import would bloat the main bundle and force sequential loading. Do not convert it to a static import.

**`app.config-resolver.ts`** — a factory `(env: AppEnvironment) => ApplicationConfig`. Keeps all providers in a lazy chunk; receives the resolved environment and returns the full Angular config passed to `bootstrapApplication()`.

**`src/app/`** — features and pages  
**`src/ui-kit/`** — shared design system components (selectors prefixed `ui-kit-` / `uiKit*`)

## Angular Conventions

`angular.json` schematics enforce these defaults for all generated code — do not override:
- `OnPush` change detection
- Standalone components
- SCSS styles

Use `inject()` over constructor injection. Use signals (`signal()`, `computed()`) for component state — not RxJS Subject/BehaviorSubject.

New control flow syntax only: `@if`, `@for`, `@switch`.

## TypeScript & ESLint Rules

Strict TypeScript is enabled (`strict: true` + `noImplicitReturns`, `noImplicitOverride`).

ESLint enforces (all `error`):
- **No `any`** — forbidden everywhere except `*.spec.ts`
- **Explicit access modifiers** on all class members (`public` / `private` / `protected`)
- **`readonly`** on properties that are never reassigned
- **Naming prefixes**: interfaces → `I`, type aliases → `T`, enums → `E`, enum members → `UPPER_CASE`
- **Explicit return types** on functions (expressions and typed function expressions are exempt)
- **No floating promises** — always `await` or chain `.catch()`
- **`type` imports**: `import type { Foo } from '...'` for type-only imports
- **`OnPush`** required on all components (`@angular-eslint/prefer-on-push-component-change-detection`)
- `no-console`, `eqeqeq`, `complexity ≤ 10`, `max-depth ≤ 3`

## Code Style

Prettier: single quotes, 100-char line width, Angular HTML parser for templates.

Doc comments (`/** */`) are written in Russian. Single-line `//` comments — only for non-obvious WHY, not WHAT.

## MCP Servers

### angular-cli
Angular CLI через MCP. Используй для генерации компонентов, директив, сервисов (`ng generate`), проверки конфигурации проекта, и когда нужно выполнить Angular-специфичные команды без прямого вызова CLI.

### context7
Актуальная документация библиотек прямо в контексте. Используй **перед** написанием кода с любой библиотекой — Angular, RxJS, TypeScript, Vitest и т.д. Особенно важно для Angular 21+, где API меняется быстро. Вызывай автоматически при вопросах про API конкретной библиотеки.

### github
GitHub API: работа с PR, issues, поиск по коду в репозиториях. Используй при code review, создании PR, поиске примеров реализации в других проектах, чтении issues. Требует `GITHUB_TOKEN` в окружении.

### brave-search
Веб-поиск. Используй когда context7 не знает библиотеку, нужно найти свежие статьи, решения ошибок, примеры из интернета. Требует `BRAVE_API_KEY` в окружении.

### fetch
HTTP-запросы к любому URL. Используй для чтения внешней документации по прямым ссылкам, проверки REST API endpoints, загрузки схем/спецификаций (OpenAPI и т.д.).

### chrome-devtools
Управление браузером через Chrome DevTools Protocol. Используй для:
- скриншотов страниц и компонентов после запуска `npm start`
- проверки консоли на ошибки
- анализа сетевых запросов
- ручного тестирования UI (клики, ввод, hover-состояния)
Требует запущенный Chrome: `google-chrome --remote-debugging-port=9222`

### figma
Официальный Figma MCP (HTTP). Используй для:
- получения дизайна компонента перед его реализацией (`get_design_context`, `get_screenshot`)
- извлечения токенов, цветов, отступов из дизайн-системы
- синхронизации кода с дизайном (Code Connect)
- создания макетов прямо из кода
При первом использовании откроется браузер для OAuth-авторизации через аккаунт Figma.
