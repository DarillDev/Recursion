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
  app/             # точка входа: app.component, app.config-resolver, app.routes
  features/        # all business features
  layouts/         # wrapper components: public/ (unauthenticated) and internal/ (sidebar + auth)
  shared/
    api/           # общий HTTP-слой: все сервисы с providedIn: 'root'
    auth/          # guards, interceptors, token model, auth service
    core/          # инфраструктура приложения (app-env и др.)
    models/        # базовые классы и типы (AControlValueAccessor, TNillable)
    ui-kit/        # reusable UI components with no business logic
```

### HTTP-слой (`shared/api/`)

Все HTTP-сервисы с `providedIn: 'root'` живут в `shared/api/` — даже если пока используются одной фичей. Причина: Angular tree-shaking удаляет неиспользуемые сервисы, поэтому штрафа за "раннее" размещение нет, зато не нужен рефакторинг при появлении второго потребителя.

```
shared/api/
  core/          # ApiService, buildParams, TQueryParams
  config/        # IApiConfig, API_CONFIG token, provideApiConfig()
  controllers/   # per-resource HTTP-сервисы (categories/, users/, …)
```

Фичи не делают HTTP-запросы напрямую — только инжектят сервисы из `@shared/api/*`.

### Контроллер (`shared/api/controllers/<resource>/`)

| Слой | Назначение |
|---|---|
| `dtos/` | Формы ответа сервера (не менять без сверки со Swagger) |
| `interfaces/` | Доменные модели |
| `services/<resource>-api/` | Сырые HTTP-вызовы через `ApiService` |
| `services/<resource>/` | Публичное API с маппингом для фич |
| `index.ts` | Barrel — единственная точка импорта |
| `README.md` | Swagger-ссылка, таблица endpoints, описание методов |

### Core modules

Each module under `shared/core/` follows the same layer structure as features, with `config/` instead of `pages/`:

| Layer | Purpose |
|---|---|
| `config/` | Angular providers (`provideX`) for DI registration |
| `interfaces/` | TypeScript interfaces (`I`-prefix) |
| `mappers/` | Data transformation (DTO → domain model) |
| `models/` | Domain model classes |

Each module exports everything through a barrel `index.ts`. Import via path alias:

```ts
import { AppEnvironment, provideAppEnvironment } from '@shared/core/app-env';
```

### Path aliases

Defined in `tsconfig.app.json` and `tsconfig.spec.json`. Both require `"baseUrl": "."`.

| Alias | Module |
|---|---|
| `@shared/core/app-env` | `src/shared/core/app-environment/` |
| `@shared/api/core` | `src/shared/api/core/` |
| `@shared/api/config` | `src/shared/api/config/` |
| `@shared/api/*` | `src/shared/api/controllers/*/index.ts` |
| `@shared/auth` | `src/shared/auth/` |
| `@shared/ui-kit/*` | `src/shared/ui-kit/*/index.ts` |
| `@layouts/*` | `src/layouts/*/index.ts` |
| `@features/*` | `src/features/*/index.ts` |

When adding a new alias, register it in both tsconfig files.

### Feature layer rules

Every feature under `features/` must follow this layer structure:

| Layer | Purpose |
|---|---|
| `pages/` | Routable components — one per route, placed directly in the router |
| `components/` | Child components and dialogs used within the feature |
| `services/` | Local state, signals store, utilities (не HTTP — только инжект из `@shared/api/*`) |
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
/login         → PublicLayout  → features/feature-login/pages/login-page
/categories    → InternalLayout (authGuard) → features/feature-categories/pages/category-list-page
/              → (не авторизован) redirect → /login
/              → (авторизован)   redirect → /categories
```

**`AuthService` управляет навигацией** — не вызывай `router.navigate` вручную после login/logout:
- `authService.login()` — сохраняет токен и редиректит на `onAuthenticated` (`/categories`)
- `authService.logout()` — очищает токен и редиректит на `onUnauthenticated` (`/login`)
- Редиректы настраиваются через `IAuthConfig.redirects` в `app.config-resolver.ts`

### UI

- No UI component library — all components are built from scratch to match Figma designs.
- Add/Edit/Delete actions open as modal dialogs — no separate routes for them.

Текущие компоненты `shared/ui-kit/`:

| Компонент | Selector | Назначение |
|---|---|---|
| `button` | `ui-kit-button` | Кнопка: `variant="primary\|secondary\|danger"`, `[disabled]`, `[type]` |
| `icon` | `ui-kit-icon` | SVG-спрайт: `name="..."` (EIconName), `[size]` |
| `modal` | `ui-kit-modal-container` | Обёртка диалога: `[title]`, `<ng-content select="[footer]">` |
| `form-field` | `ui-kit-form-field` | Враппер поля формы с label/hint/error |
| `input` | `ui-kit-input-field` | Текстовый input с CVA |
| `input` | `ui-kit-search-input` | Поле поиска |

**Modal** использует `@angular/cdk/dialog`. Открывать через `ModalService`:

```ts
// в диалоговом компоненте
@Component({
  imports: [ModalContainerComponent],
  template: `
    <ui-kit-modal-container title="Edit">
      <!-- body -->
      <div footer>
        <ui-kit-button variant="secondary" (click)="close()">Close</ui-kit-button>
        <ui-kit-button variant="primary" (click)="save()">Save</ui-kit-button>
      </div>
    </ui-kit-modal-container>
  `,
})
export class MyDialogComponent {
  private readonly dialogRef = inject(DialogRef);
  protected close(): void { this.dialogRef.close(); }
}

// открытие
this.modalService.open<TResult>(MyDialogComponent, data).subscribe(result => { ... });
```

## Architecture

Angular 21 standalone application. Entry point: `src/main.ts` → `app.config-resolver.ts` → `app.routes.ts`.

**Bootstrap strategy (`main.ts`):** `environment.json` (fetch) and `app.config-resolver` (dynamic `import()`) are loaded in parallel via `Promise.all`. The resolver is a separate lazy chunk — a static import would bloat the main bundle and force sequential loading. Do not convert it to a static import.

**`app.config-resolver.ts`** — a factory `(env: AppEnvironment) => ApplicationConfig`. Keeps all providers in a lazy chunk; receives the resolved environment and returns the full Angular config passed to `bootstrapApplication()`.

**Обязательные провайдеры:** `provideHttpClient()` — без него `HttpClient` не работает.

### Dev proxy

`proxy.conf.json` проксирует `/api/*` → `https://zidium3-backend.zidium.net/*` (стрипает `/api` prefix).
`public/environment.json` использует `"apiUrl": "/api"` для dev-режима.

## Angular Conventions

`angular.json` schematics enforce these defaults for all generated code — do not override:
- `OnPush` change detection
- Standalone components and pipes
- SCSS styles

Use `inject()` over constructor injection. Use signals (`signal()`, `computed()`) for component state — not RxJS Subject/BehaviorSubject.

New control flow syntax only: `@if`, `@for`, `@switch`.

## TypeScript & ESLint Rules

Strict TypeScript is enabled (`strict: true` + `noImplicitReturns`, `noImplicitOverride`).

ESLint enforces (all `error`):
- **No `any`** — forbidden everywhere except `*.spec.ts`
- **Explicit access modifiers** on all class members (`public` / `private` / `protected`) — конструкторы исключены
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

## Testing Gotchas

**OnPush компоненты:** изменение свойств `TestHostComponent` не триггерит re-render автоматически. Перед `fixture.detectChanges()` вызывать `cdr.markForCheck()`:

```ts
const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
fixture.componentInstance.someInput = newValue;
cdr.markForCheck();
fixture.detectChanges();
```

**TestHostComponent** тоже должен иметь `changeDetection: ChangeDetectionStrategy.OnPush` — ESLint требует OnPush на всех компонентах, включая тестовые.

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
