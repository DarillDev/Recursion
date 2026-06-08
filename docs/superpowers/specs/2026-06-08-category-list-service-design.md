# CategoryListService — дизайн рефакторинга

## Цель

Вынести логику работы с данными из `CategoryListPageComponent` в отдельный `CategoryListService`, реализованный через `rxResource` (Angular 21).

---

## Проблема

`CategoryListPageComponent` содержит:
- загрузку и пагинацию (infinite scroll)
- debounce-поиск
- CRUD-операции и мутацию списка
- управление сигналами состояния

Всё это — логика данных, а не UI. Компонент должен только рендерить и обрабатывать пользовательские события.

---

## Архитектура

### Подход: `rxResource` + `effect` для аккумуляции страниц

```
[search signal] ──┐
[sortDesc signal] ─┼→ params computed → rxResource(stream) → effect → _items signal
[pageNumber signal]┘                                           ↓
                                                          [hasMore, canEdit]
```

`rxResource` фетчит ровно одну страницу. `effect` смотрит на `resource.value()` и:
- если `pageNumber === 0` (reset) → перезаписывает `_items`
- если `pageNumber > 0` (append) → дописывает в `_items`

`pageNumber` читается через `untracked()` внутри эффекта — намеренный разрыв реактивного трекинга, чтобы не создавать цикл зависимостей.

---

## Сервис: `CategoryListService`

### Размещение и DI

```
features/feature-categories/pages/category-list-page/services/category-list/category-list.service.ts
```

Декоратор `@Injectable()` без `providedIn`. Предоставляется через `providers: [CategoryListService]` в компоненте. Lifetime сервиса = lifetime компонента — `takeUntilDestroyed()` работает без явного `DestroyRef`.

### Публичный API

| Член | Тип | Описание |
|---|---|---|
| `items` | `Signal<ICategory[]>` | Аккумулированный список |
| `hasMore` | `Signal<boolean>` | Есть ли следующая страница |
| `canEdit` | `Signal<boolean>` | Права на редактирование |
| `sortDesc` | `Signal<boolean>` | Текущее направление сортировки |
| `isLoading` | `Signal<boolean>` | Пробрасывается из `resource.isLoading` |
| `search(query)` | `void` | Debounce 300 мс; сбрасывает страницу |
| `toggleSort()` | `void` | Инвертирует `sortDesc`; сбрасывает страницу |
| `loadMore()` | `void` | Инкрементирует `pageNumber` |
| `add(form)` | `Observable<ICategory>` | Создаёт и добавляет в начало списка |
| `update(id, form)` | `Observable<ICategory>` | Обновляет и заменяет в списке |
| `delete(id)` | `Observable<void>` | Удаляет из списка |

### Внутреннее устройство

```ts
@Injectable()
export class CategoryListService {
  private readonly api = inject(CategoriesApiService);

  private readonly _search = signal('');
  private readonly _sortDesc = signal(false);
  private readonly _pageNumber = signal(0);
  private readonly PAGE_SIZE = 20;
  private readonly searchSubject = new Subject<string>();

  private readonly resource = rxResource<ICategoriesListResult, ICategoriesSearchParams>({
    params: () => ({
      search: this._search(),
      sortDesc: this._sortDesc(),
      pageNumber: this._pageNumber(),
      pageSize: this.PAGE_SIZE + 1,
    }),
    stream: ({ params }) => this.api.getList(params),
  });

  private readonly _items = signal<ICategory[]>([]);
  private readonly _hasMore = signal(true);
  private readonly _canEdit = signal(false);

  readonly items = this._items.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly canEdit = this._canEdit.asReadonly();
  readonly sortDesc = this._sortDesc.asReadonly();
  readonly isLoading = this.resource.isLoading;

  constructor() {
    // debounce поиска
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(query => this.resetWith({ search: query }));

    // аккумуляция страниц
    effect(() => {
      const result = this.resource.value();
      if (!result) return;

      const page = untracked(() => this._pageNumber());
      const hasMore = result.items.length > this.PAGE_SIZE;
      const items = hasMore ? result.items.slice(0, this.PAGE_SIZE) : result.items;

      this._hasMore.set(hasMore);
      this._canEdit.set(result.canEdit);

      if (page === 0) {
        this._items.set(items);
      } else {
        this._items.update(list => [...list, ...items]);
      }
    });
  }

  search(query: string): void { this.searchSubject.next(query); }

  toggleSort(): void { this.resetWith({ sortDesc: !this._sortDesc() }); }

  loadMore(): void {
    if (this._hasMore() && !this.isLoading()) {
      this._pageNumber.update(n => n + 1);
    }
  }

  add(form: ICategoryForm): Observable<ICategory> {
    return this.api.create(form).pipe(
      tap(created => this._items.update(list => [created, ...list])),
    );
  }

  update(id: number, form: ICategoryForm): Observable<ICategory> {
    return this.api.update(id, form).pipe(
      tap(updated => this._items.update(list => list.map(i => (i.id === updated.id ? updated : i)))),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => this._items.update(list => list.filter(i => i.id !== id))),
    );
  }

  private resetWith(patch: { search?: string; sortDesc?: boolean }): void {
    if (patch.search !== undefined) this._search.set(patch.search);
    if (patch.sortDesc !== undefined) this._sortDesc.set(patch.sortDesc);
    this._pageNumber.set(0);
    this._items.set([]);
    this._hasMore.set(true);
  }
}
```

---

## Компонент после рефакторинга

`CategoryListPageComponent` становится тонкой UI-оболочкой:

- Инжектит `CategoryListService`
- Шаблон читает `service.items()`, `service.isLoading()`, `service.canEdit()`, `service.sortDesc()`
- Scroll-событие → `service.loadMore()`
- Поиск → `service.search(value)`
- Сортировка → `service.toggleSort()`
- CRUD: открывает диалог/подтверждение → вызывает `service.add/update/delete(...).subscribe()`
- Убирает `ngOnInit`, `DestroyRef`, `Subject`, `loadPage`, все `signal()`

---

## Обработка ошибок

`isLoading` автоматически сбрасывается при ошибке (`rxResource` управляет состоянием). Компонент может читать `resource.error()` через публичное свойство, если нужен UI для ошибки (в текущей реализации не используется).

---

## Тестирование

- Юнит-тест сервиса: mock `CategoriesApiService`, проверить аккумуляцию страниц, reset при поиске/сортировке, мутации списка при CRUD.
- Существующий spec компонента обновляется: mock `CategoryListService` вместо `CategoriesApiService`.
