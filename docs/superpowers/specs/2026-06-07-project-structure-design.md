# Project Structure Design

Date: 2026-06-07

## Context

Angular 21 standalone application. One feature at launch — Categories directory (CRUD). Auth via JWT. Custom UI (no component library).

## Directory Structure

```
src/
  app/
    core/                        # глобальные гварды, интерсепторы, общие модели
      guards/
      interceptors/
      models/
      constants/

    layouts/                     # компоненты-обёртки, задают визуальные слои приложения
      public/                    # без авторизации — просто рендерит роуты
      internal/                  # с авторизацией — сайдбар + роуты; содержит components/

    features/                    # все бизнес-фичи проекта
      auth/                      # авторизация и управление токеном
        pages/
        services/
        models/
        constants/

      categories/                # справочник категорий
        pages/
        components/
        services/
        models/
        constants/

  ui-kit/                        # переиспользуемые UI-компоненты без бизнес-логики
    table/
    dialog/
    form-field/
    search-input/
```

## Layer Rules (per feature)

| Layer | Contents |
|---|---|
| `pages/` | Routable page components — one component per route |
| `components/` | Child components and dialogs used within the feature |
| `services/` | Any services: HTTP, store (signals), utilities |
| `models/interfaces/` | TypeScript interfaces (`I`-prefix) |
| `models/types/` | Type aliases (`T`-prefix) |
| `models/enums/` | Enums (`E`-prefix) |
| `constants/` | Feature-level constants |

## Routing

```
/login          → PublicLayout  → auth/pages/login
/categories     → InternalLayout (authGuard) → categories/pages/categories-list
/               → redirect → /categories
```

## Key Decisions

- **No UI library** — all components built from scratch to match Figma designs
- **Manual API services** — HTTP services written by hand (no openapi-generator)
- **Signals store as service** — `CategoriesStore` lives in `services/`, is a plain `@Injectable` using Angular signals
- **Modals instead of routes** — Add/Edit/Delete implemented as dialog overlays (matches Figma); no `/categories/:id` route
- **Dialog state is local** — open/close state held in `CategoriesListComponent` signals, not in store
- **Sidebar collapse state** — signal in `InternalLayoutComponent`, not global
- **PublicLayout** — renders `<router-outlet>` only, no visual chrome
- **InternalLayout** — collapsible sidebar (icon nav + user/logout at bottom) + `<router-outlet>`
