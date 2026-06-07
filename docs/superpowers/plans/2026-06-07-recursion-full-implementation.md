# Recursion — план реализации

> **Для агентного выполнения:** используй скил `.claude/skills/recursion-task` при начале работы над каждой задачей.

**Цель:** Angular 21 SPA — справочник Categories с полным CRUD, JWT-авторизацией и infinite scroll.

**Архитектура:** Standalone-компоненты, signals, lazy routing, functional guards/interceptors. OpenAPI-сгенерированный HTTP-клиент. UI-компоненты строятся с нуля под Figma-дизайн.

**Стек:** Angular 21, RxJS 7, @openapitools/openapi-generator-cli, Vitest

---

## Фаза 1: Основа ✅

### [x] Задача 1: Инициализация проекта
**Ветка:** `main`

- [x] `ng new recursion` — Angular 21, standalone, SCSS, strict TypeScript
- [x] Настройка Vitest вместо Karma
- [x] ESLint с правилами: no-any, explicit-access-modifiers, OnPush, naming prefixes
- [x] Prettier: single quotes, 100-char width

---

### [x] Задача 2: Документация проекта
**Ветка:** `main`

- [x] `CLAUDE.md` — правила структуры, конвенции Angular, стек
- [x] `docs/categories-spec.md` — ТЗ на функционал Categories

---

## Фаза 2: API-клиент

### [ ] Задача 3: Генерация OpenAPI-клиента
**Ветка:** `feat/api-client`

Сгенерировать TypeScript-клиент из Swagger бэкенда. API: `https://zidium3-backend.zidium.net/swagger/index.html?urls.primaryName=Front`

**Создать / изменить:**
- `package.json` — добавить `@openapitools/openapi-generator-cli` в devDependencies, скрипт `"generate:api": "openapi-generator-cli generate"`
- `openapitools.json` — конфиг генератора: generator `typescript-angular`, input URL, output `src/app/core/api/`
- `.gitignore` — добавить `src/app/core/api/`
- `src/app/core/api/` — сгенерированные файлы (добавляются в git только через скрипт)

**Готово когда:**
- `npm run generate:api` успешно запускается
- В `src/app/core/api/` появляются TypeScript-сервисы для `/front/categories` и `/front/logon`
- `npm run build` не выдаёт ошибок

---

## Фаза 3: Core

### [ ] Задача 4: Auth-сервис
**Ветка:** `feat/auth-service`

JWT: хранение токена, вход, выход, автообновление.

**Создать:**
- `src/app/core/models/interfaces/i-auth-tokens.ts` — `{ accessToken: string; refreshToken: string }`
- `src/app/core/models/interfaces/i-login-request.ts` — `{ login: string; password: string }`
- `src/app/core/services/auth.service.ts` — `login()`, `logout()`, `isAuthenticated()` как `computed()`, хранение в `localStorage`
- `src/app/core/services/auth.service.spec.ts`

**Готово когда:**
- `isAuthenticated()` возвращает `false` без токена, `true` с токеном
- `logout()` очищает localStorage
- Unit-тесты проходят

---

### [ ] Задача 5: HTTP-интерсептор авторизации
**Ветка:** `feat/auth-interceptor`

Добавлять `Authorization: Bearer <token>` к каждому запросу.

**Создать / изменить:**
- `src/app/core/interceptors/auth.interceptor.ts` — functional interceptor, читает токен из `AuthService`
- `src/app/core/interceptors/auth.interceptor.spec.ts`
- `src/app/app.config.ts` — добавить `provideHttpClient(withInterceptors([authInterceptor]))`

**Готово когда:**
- Тест: запрос с токеном имеет заголовок `Authorization`
- Тест: запрос без токена не имеет заголовка

---

### [ ] Задача 6: Auth guard
**Ветка:** `feat/auth-guard`

Защита внутренних маршрутов — редирект на `/login` без токена.

**Создать:**
- `src/app/core/guards/auth.guard.ts` — functional guard, `inject(AuthService).isAuthenticated()`
- `src/app/core/guards/auth.guard.spec.ts`

**Готово когда:**
- Тест: без токена → `UrlTree` на `/login`
- Тест: с токеном → `true`

---

## Фаза 4: App Shell

### [ ] Задача 7: Маршрутизация
**Ветка:** `feat/routing`

Подключить все маршруты, layouts и guard.

**Изменить:**
- `src/app/app.routes.ts` — три маршрута:
  - `/login` → `PublicLayoutComponent` → `LoginComponent` (lazy)
  - `/categories` → `InternalLayoutComponent` (canActivate: `authGuard`) → `CategoriesListComponent` (lazy)
  - `''` → `redirectTo: '/categories'`
- `src/app/app.config.ts` — `provideRouter(routes, withRouterConfig({...}))`, `provideHttpClient()`

**Готово когда:**
- `npm start` запускается без ошибок
- `npm run lint` чист
- Компоненты layouts и pages создаются как заглушки в следующих задачах

---

### [ ] Задача 8: Public layout
**Ветка:** `feat/public-layout`

Минималистичная обёртка для неавторизованных страниц.

**Создать:**
- `src/app/layouts/public/public-layout.component.ts` — только `RouterOutlet`
- `src/app/layouts/public/public-layout.component.html` — `<router-outlet />`
- `src/app/layouts/public/public-layout.component.scss` — пусто

**Готово когда:**
- `/login` рендерится через PublicLayout (без sidebar)
- `npm run lint` чист

---

### [ ] Задача 9: Internal layout + Sidebar
**Ветка:** `feat/internal-layout`

Боковая навигация (коллапсируется) + `<router-outlet>`.

**Figma:** `https://www.figma.com/design/KCYaDH4HaImmOB7ZASq784/Zidium?node-id=1508-21270`

**Создать:**
- `src/app/layouts/internal/internal-layout.component.ts`
- `src/app/layouts/internal/internal-layout.component.html` — flex-контейнер: `<app-sidebar>` + `<main><router-outlet /></main>`
- `src/app/layouts/internal/internal-layout.component.scss`
- `src/app/layouts/internal/components/sidebar/sidebar.component.ts` — `isCollapsed = signal(false)`, кнопка toggle, навигация (Categories), кнопка Logout внизу
- `src/app/layouts/internal/components/sidebar/sidebar.component.html`
- `src/app/layouts/internal/components/sidebar/sidebar.component.scss`

**Готово когда:**
- `/categories` показывает sidebar + outlet
- Клик по кнопке toggle сворачивает/разворачивает sidebar
- Logout вызывает `AuthService.logout()` + навигация на `/login`

---

## Фаза 5: Auth Feature

### [ ] Задача 10: Login page
**Ветка:** `feat/login-page`

Форма входа по дизайну Figma: поля логин/пароль, три состояния ошибок.

**Figma:** макеты "Авторизация", "Авторизация / Ошибки / Не заполнено", "Авторизация / Ошибки / Ошибка входа"

**Создать:**
- `src/app/features/auth/pages/login/login.component.ts` — reactive form, signals для `isLoading` и `errorMessage`, вызов `AuthService.login()`, редирект на `/categories`
- `src/app/features/auth/pages/login/login.component.html`
- `src/app/features/auth/pages/login/login.component.scss`
- `src/app/features/auth/pages/login/login.component.spec.ts`

**Готово когда:**
- Успешный вход (`test` / `77777`) → редирект на `/categories`
- Незаполненные поля → inline-ошибки валидации
- Неверные данные → сообщение об ошибке от сервера
- `npm run lint` чист

---

## Фаза 6: UI Kit

### [ ] Задача 11: TableComponent
**Ветка:** `feat/ui-table`

Переиспользуемая таблица: конфигурируемые колонки, кликабельные заголовки для сортировки.

**Figma:** макет "Справочник" — секция таблицы

**Создать:**
- `src/ui-kit/table/table.component.ts` — selector `ui-kit-table`, inputs: `columns`, `rows`, `sortColumn`, `sortDesc`; output: `sortChange`
- `src/ui-kit/table/table.component.html` — `<table>` с `@for`
- `src/ui-kit/table/table.component.scss`
- `src/ui-kit/table/table.component.spec.ts`

**Готово когда:**
- Тест: рендерит N строк при N элементах
- Тест: клик по заголовку эмитирует `sortChange` с именем колонки
- `npm run lint` чист

---

### [ ] Задача 12: SearchInputComponent
**Ветка:** `feat/ui-search-input`

Поле поиска с иконкой, debounce 300ms, кнопкой очистки.

**Figma:** макет "Справочник" — строка поиска

**Создать:**
- `src/ui-kit/search-input/search-input.component.ts` — selector `ui-kit-search-input`, `valueChange` output с debounce через `rxjs/operators`
- `src/ui-kit/search-input/search-input.component.html`
- `src/ui-kit/search-input/search-input.component.scss`
- `src/ui-kit/search-input/search-input.component.spec.ts`

**Готово когда:**
- Тест: `valueChange` не эмитит раньше 300ms
- Тест: кнопка очистки сбрасывает значение и эмитит `''`

---

### [ ] Задача 13: FormFieldComponent
**Ветка:** `feat/ui-form-field`

Обёртка поля формы: label, content projection для input, сообщение об ошибке.

**Figma:** макет формы в диалоге

**Создать:**
- `src/ui-kit/form-field/form-field.component.ts` — selector `ui-kit-form-field`, inputs: `label`, `errorMessage`
- `src/ui-kit/form-field/form-field.component.html` — `<label>`, `<ng-content>`, `<span class="error">`
- `src/ui-kit/form-field/form-field.component.scss`
- `src/ui-kit/form-field/form-field.component.spec.ts`

**Готово когда:**
- Тест: показывает label
- Тест: показывает errorMessage при наличии
- Тест: скрывает errorMessage при отсутствии

---

### [ ] Задача 14: DialogComponent
**Ветка:** `feat/ui-dialog`

Модальный диалог: заголовок, контент, footer; закрытие по Esc и клику на backdrop.

**Figma:** макет диалога добавления/редактирования

**Создать:**
- `src/ui-kit/dialog/dialog.component.ts` — selector `ui-kit-dialog`, input `title`, output `closed`; Esc через `@HostListener`
- `src/ui-kit/dialog/dialog.component.html` — backdrop + panel: header + `<ng-content>` + `<ng-content select="[footer]">`
- `src/ui-kit/dialog/dialog.component.scss`
- `src/ui-kit/dialog/dialog.service.ts` — `open<T>(component, data?)` через `createComponent` + `ApplicationRef`
- `src/ui-kit/dialog/dialog.component.spec.ts`

**Готово когда:**
- Тест: клик на backdrop эмитит `closed`
- Тест: Esc эмитит `closed`
- Тест: клик внутри панели не закрывает диалог

---

## Фаза 7: Categories

### [ ] Задача 15: Categories — модели и API-сервис
**Ветка:** `feat/categories-api`

Типы данных и HTTP-обёртка для всех endpoints справочника.

**Создать:**
- `src/app/features/categories/models/interfaces/i-category.ts` — `{ id: string; name: string; canEdit: boolean }`
- `src/app/features/categories/models/interfaces/i-categories-query.ts` — `{ pageNumber: number; search?: string; sortDesc?: boolean }`
- `src/app/features/categories/models/interfaces/i-categories-page.ts` — `{ items: ICategory[]; total: number }`
- `src/app/features/categories/services/categories-api.service.ts` — методы: `getAll(query)`, `getById(id)`, `create(name)`, `update(id, name)`, `delete(id)`, `nameExists(name, id?)`
- `src/app/features/categories/services/categories-api.service.spec.ts` — `HttpTestingController`

**Готово когда:**
- Тест: `getAll()` делает `GET /front/categories` с правильными query params
- Тест: `create()` делает `POST /front/categories` с `{ name }`
- Тест: `nameExists()` делает `GET /front/categories/name-exists?name=&id=`

---

### [ ] Задача 16: Categories — список
**Ветка:** `feat/categories-list`

Страница `/categories`: таблица + поиск + сортировка + infinite scroll + canEdit.

**Создать:**
- `src/app/features/categories/services/categories-store.service.ts` — signals store: `items`, `isLoading`, `hasMore`, `search`, `sortDesc`; методы `loadNextPage()`, `reset()`
- `src/app/features/categories/pages/categories-list/categories-list.component.ts` — inject store, кнопки Add/Edit/Delete (скрываются если `canEdit = false`)
- `src/app/features/categories/pages/categories-list/categories-list.component.html` — `<ui-kit-search-input>` + `<ui-kit-table>` + IntersectionObserver-триггер
- `src/app/features/categories/pages/categories-list/categories-list.component.scss`
- `src/app/features/categories/pages/categories-list/categories-list.component.spec.ts`

**Готово когда:**
- Список загружается при открытии страницы (`pageNumber=0`)
- Поиск делает новый запрос с `search` параметром (debounce)
- Клик по заголовку Name переключает `sortDesc`
- При скролле до конца загружается следующая страница
- `canEdit = false` скрывает кнопки Add/Edit/Delete

---

### [ ] Задача 17: Categories — диалог добавления / редактирования
**Ветка:** `feat/categories-edit-dialog`

Диалог с формой: поле Name, async-валидация уникальности, сохранение.

**Создать:**
- `src/app/features/categories/components/category-form-dialog/category-name.validator.ts` — async validator: вызывает `nameExists()`, debounce 400ms
- `src/app/features/categories/components/category-form-dialog/category-form-dialog.component.ts` — два режима (add / edit), reactive form с async validator, signals для `isLoading`
- `src/app/features/categories/components/category-form-dialog/category-form-dialog.component.html` — `<ui-kit-dialog>` + `<ui-kit-form-field>`
- `src/app/features/categories/components/category-form-dialog/category-form-dialog.component.scss`
- `src/app/features/categories/components/category-form-dialog/category-form-dialog.component.spec.ts`

**Готово когда:**
- Тест: submit создаёт запись (add mode)
- Тест: submit обновляет запись (edit mode)
- Тест: дублирующееся Name → ошибка "Name already taken"
- Тест: `canEdit = false` → поля readonly, кнопка Save скрыта

---

### [ ] Задача 18: Categories — подтверждение удаления
**Ветка:** `feat/categories-delete-dialog`

Диалог "Вы уверены?" перед удалением записи.

**Создать:**
- `src/app/features/categories/components/category-delete-dialog/category-delete-dialog.component.ts` — input `categoryName`, outputs `confirmed` / `cancelled`
- `src/app/features/categories/components/category-delete-dialog/category-delete-dialog.component.html` — `<ui-kit-dialog>` с текстом подтверждения
- `src/app/features/categories/components/category-delete-dialog/category-delete-dialog.component.scss`
- `src/app/features/categories/components/category-delete-dialog/category-delete-dialog.component.spec.ts`

**Готово когда:**
- Тест: клик "Удалить" → `confirmed` эмитится, вызов `DELETE /front/categories/{id}`
- Тест: клик "Отмена" → `cancelled` эмитится, запись остаётся
- После удаления запись исчезает из списка без перезагрузки страницы

---

## Прогресс

| Фаза | Задач | Готово |
|------|-------|--------|
| 1 — Основа | 2 | ✅ 2/2 |
| 2 — API-клиент | 1 | 0/1 |
| 3 — Core | 3 | 0/3 |
| 4 — App Shell | 3 | 0/3 |
| 5 — Auth Feature | 1 | 0/1 |
| 6 — UI Kit | 4 | 0/4 |
| 7 — Categories | 4 | 0/4 |
| **Итого** | **18** | **2/18** |
