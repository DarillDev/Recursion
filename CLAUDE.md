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

## Architecture

Angular 21 standalone application. Entry point: `src/main.ts` → `app.config.ts` → `app.routes.ts`.

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
