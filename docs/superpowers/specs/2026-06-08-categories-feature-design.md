# Categories Feature — Design Spec

Date: 2026-06-08

## Overview

Справочник категорий: список с поиском, сортировкой и infinite scroll; добавление и редактирование через диалог; удаление с подтверждением. Все CRUD-действия — через диалоги, отдельный роут `/categories/{id}` не создаётся.

---

## File Structure

```
features/feature-categories/
  pages/
    category-list-page/               # расширяем существующий
  components/
    category-form-dialog/             # диалог создания / редактирования
      category-form-dialog.component.ts
      category-form-dialog.component.html
      category-form-dialog.component.scss
  models/
    interfaces/
      category-form.interface.ts      # ICategoryForm { name: string }

shared/ui-kit/confirmation/
  confirmation-dialog/
    confirmation-dialog.component.ts
    confirmation-dialog.component.html
    confirmation-dialog.component.scss
  confirmation.service.ts
  index.ts

shared/api/controllers/categories/
  interfaces/
    categories-search-params.interface.ts   # добавляем pageSize?: number
```

---

## CategoryListPageComponent

### State (signals)

```ts
readonly items     = signal<ICategory[]>([]);
readonly isLoading = signal(false);
readonly hasMore   = signal(true);
readonly searchQuery = signal('');
readonly sortDesc    = signal(false);

private pageNumber = 0;
private readonly PAGE_SIZE = 20;
```

### Загрузка данных

- Метод `loadPage(reset: boolean)`:
  - Если `reset = true` — обнуляет `pageNumber`, `items`, `hasMore`
  - Запрашивает `pageSize = PAGE_SIZE + 1` (21)
  - Если вернулось ≤ PAGE_SIZE (20) → `hasMore.set(false)`
  - Показывает первые PAGE_SIZE записей, аппендит к `items`
  - Инкрементирует `pageNumber`

- **Поиск**: `effect` следит за `searchQuery` с debounce 300 мс (через `Subject` + `debounceTime`), при изменении вызывает `loadPage(true)`.

- **Сортировка**: клик по заголовку колонки Name переключает `sortDesc`, вызывает `loadPage(true)`.

- **Infinite scroll**: обработчик `(scroll)` на контейнере таблицы:
  ```ts
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100 && this.hasMore() && !this.isLoading()) {
    this.loadPage(false);
  }
  ```

### CRUD

| Действие | Шаги |
|----------|------|
| **Add** | Открыть `CategoryFormDialog` без данных → получить `ICategoryForm` → вызвать `create()` → добавить запись в начало `items` |
| **Edit** | Открыть `CategoryFormDialog` с `ICategory` → получить `ICategoryForm` → вызвать `update()` → заменить запись в `items` |
| **Delete** | `ConfirmationService.confirm(title, description)` → если `true` → вызвать `delete()` → убрать запись из `items` |

### Доступность действий

Если `canEdit = false` у конкретной записи — кнопки Edit и Delete для неё скрыты.
Если ни одна запись не имеет `canEdit = true` — кнопка Add не показывается (проверяем по первой записи или флагу с сервера).

> **Открытый вопрос:** спека говорит что `canEdit` — поле записи. Кнопка Add — глобальная. Уточнить у бэкенда есть ли глобальный флаг `canEdit`, или прятать Add если все записи `canEdit = false`.

---

## CategoryFormDialogComponent

### Входные данные (CDK Dialog data)

```ts
type TCategoryDialogData = ICategory | undefined;
```

- `undefined` → режим Create
- `ICategory` → режим Edit, форма заполняется данными

### Форма

```ts
fb.nonNullable.group({
  name: ['', [Validators.required], [nameExistsAsyncValidator]]
})
```

### Async-валидатор `nameExistsAsyncValidator`

- Вызывает `GET /front/categories/name-exists` с `{ name, id }`:
  - `id` = `category.id` при редактировании, `null` при создании
- Debounce 400 мс
- Если сервер вернул `true` → ошибка `{ nameExists: true }`

### Результат

- При сабмите (форма валидна) → диалог закрывается, возвращает `ICategoryForm`
- При отмене → диалог закрывается, возвращает `undefined`
- Кнопка Save скрыта если `canEdit = false` (при редактировании)

---

## ConfirmationService + ConfirmationDialogComponent

```ts
// confirmation.service.ts
confirm(title: string, description: string): Observable<boolean>
```

- Открывает `ConfirmationDialogComponent` через CDK Dialog
- Диалог показывает `title` и `description`, кнопки «Подтвердить» и «Отмена»
- Возвращает `Observable<boolean>`: `true` — подтверждено, `false` — отменено / закрыто

---

## ICategoriesSearchParams (обновление)

```ts
export interface ICategoriesSearchParams {
  pageNumber?: number;
  pageSize?: number;    // новый параметр
  search?: string;
  sortDesc?: boolean;
}
```

---

## ICategoryForm

```ts
export interface ICategoryForm {
  name: string;
}
```

---

## Routing

Новых роутов не добавляется. Всё CRUD — через диалоги на странице `/categories`.

---

## Out of Scope

- Отдельная страница `/categories/{id}`
- Тесты (отдельная задача)
- Pagination через URL-параметры
