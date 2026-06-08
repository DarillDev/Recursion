# CategoryListService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переписать `CategoryListService` через `rxResource`, вынести в него всю логику данных и CRUD; компонент оставить тонкой UI-обёрткой.

**Architecture:** `rxResource` с `params`-factory фетчит одну страницу; `effect` аккумулирует страницы в `_items` (page 0 → reset, page > 0 → append). CRUD-методы вызывают API и мутируют `_items` через `tap()`. Сервис предоставляется через `providers: [CategoryListService]` в компоненте.

**Tech Stack:** Angular 21, `rxResource` / `effect` / `signal` (из `@angular/core`), `takeUntilDestroyed` / `untracked` (из `@angular/core/rxjs-interop`), RxJS `debounceTime` / `tap`, Vitest.

---

## Карта файлов

| Действие | Файл |
|---|---|
| **Переписать** | `src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.ts` |
| **Создать** | `src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.spec.ts` |
| **Обновить** | `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts` |
| **Обновить** | `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts` |

---

## Task 1: Написать спецификацию для `CategoryListService`

**Files:**
- Create: `src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.spec.ts`

- [ ] **Step 1: Создать файл спецификации**

```ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { CategoriesApiService } from '@shared/api/categories';
import type { ICategory, ICategoriesListResult } from '@shared/api/categories';
import { CategoryListService } from './category-list.service';

const cat = (id: number, name = `Cat${id}`): ICategory => ({ id, name });
const listResult = (items: ICategory[], canEdit = true): ICategoriesListResult => ({
  items,
  canEdit,
});

describe('CategoryListService', () => {
  let service: CategoryListService;
  let api: { getList: Mock; create: Mock; update: Mock; delete: Mock };

  beforeEach(() => {
    api = {
      getList: vi.fn().mockReturnValue(of(listResult([]))),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        CategoryListService,
        { provide: CategoriesApiService, useValue: api },
      ],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();
  });

  // --- Начальная загрузка ---

  it('запрашивает страницу 0 при создании', () => {
    expect(api.getList).toHaveBeenCalledWith({
      search: '',
      sortDesc: false,
      pageNumber: 0,
      pageSize: 21,
    });
  });

  it('помещает items из первой страницы в список', () => {
    api.getList.mockReturnValue(of(listResult([cat(1), cat(2)])));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();
    expect(service.items()).toEqual([cat(1), cat(2)]);
  });

  it('hasMore = false когда сервер вернул < PAGE_SIZE+1 элементов', () => {
    api.getList.mockReturnValue(of(listResult([cat(1)])));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();
    expect(service.hasMore()).toBe(false);
  });

  it('hasMore = true и список обрезается до PAGE_SIZE когда сервер вернул PAGE_SIZE+1', () => {
    const items = Array.from({ length: 21 }, (_, i) => cat(i));
    api.getList.mockReturnValue(of(listResult(items)));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();
    expect(service.hasMore()).toBe(true);
    expect(service.items().length).toBe(20);
  });

  // --- Пагинация ---

  it('loadMore() дозапрашивает страницу 1 и добавляет элементы', () => {
    const page0 = Array.from({ length: 21 }, (_, i) => cat(i));
    const page1 = [cat(100), cat(101)];
    api.getList
      .mockReturnValueOnce(of(listResult(page0)))
      .mockReturnValueOnce(of(listResult(page1)));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();

    service.loadMore();
    TestBed.flushEffects();

    expect(service.items().length).toBe(22); // 20 + 2
    expect(service.items()[20]).toEqual(cat(100));
  });

  it('loadMore() ничего не делает когда hasMore = false', () => {
    api.getList.mockReturnValue(of(listResult([cat(1)])));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();
    const callsBefore = api.getList.mock.calls.length;

    service.loadMore();
    TestBed.flushEffects();

    expect(api.getList.mock.calls.length).toBe(callsBefore);
  });

  // --- Поиск ---

  it('search() сбрасывает список и перезапрашивает через 300 мс', fakeAsync(() => {
    api.getList.mockReturnValue(of(listResult([cat(1)]))); // initial
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();

    api.getList.mockReturnValue(of(listResult([cat(99)])));
    service.search('foo');
    tick(300);
    TestBed.flushEffects();

    expect(service.items()).toEqual([cat(99)]);
    expect(api.getList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'foo', pageNumber: 0 }));
  }));

  // --- Сортировка ---

  it('toggleSort() инвертирует sortDesc и сбрасывает страницу', () => {
    expect(service.sortDesc()).toBe(false);
    service.toggleSort();
    TestBed.flushEffects();
    expect(service.sortDesc()).toBe(true);
    expect(api.getList).toHaveBeenLastCalledWith(expect.objectContaining({ sortDesc: true, pageNumber: 0 }));
  });

  // --- CRUD ---

  it('add() вызывает API и добавляет элемент в начало списка', () => {
    const newCat = cat(42, 'New');
    api.create = vi.fn().mockReturnValue(of(newCat));
    service.add({ name: 'New', description: '' }).subscribe();
    expect(service.items()[0]).toEqual(newCat);
  });

  it('update() вызывает API и заменяет элемент в списке', () => {
    api.getList.mockReturnValue(of(listResult([cat(1, 'Old')])));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();

    const updated = cat(1, 'Updated');
    api.update = vi.fn().mockReturnValue(of(updated));
    service.update(1, { name: 'Updated', description: '' }).subscribe();
    expect(service.items()[0]).toEqual(updated);
  });

  it('delete() вызывает API и удаляет элемент из списка', () => {
    api.getList.mockReturnValue(of(listResult([cat(1), cat(2)])));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CategoryListService, { provide: CategoriesApiService, useValue: api }],
    });
    service = TestBed.inject(CategoryListService);
    TestBed.flushEffects();

    api.delete = vi.fn().mockReturnValue(of(void 0));
    service.delete(1).subscribe();
    expect(service.items().map((i) => i.id)).not.toContain(1);
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться, что все падают**

```bash
npx ng test --include="src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.spec.ts"
```

Ожидаемый результат: FAIL с ошибкой импорта или "not a function" — сервис не реализован.

---

## Task 2: Реализовать `CategoryListService`

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.ts`

- [ ] **Step 1: Переписать файл сервиса**

```ts
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { Signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { Subject, debounceTime, tap } from 'rxjs';
import {
  CategoriesApiService,
  type ICategoriesListResult,
  type ICategoriesSearchParams,
  type ICategory,
} from '@shared/api/categories';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';

@Injectable()
export class CategoryListService {
  private readonly api = inject(CategoriesApiService);

  // Внутренние параметры запроса
  private readonly _search = signal('');
  private readonly _sortDesc = signal(false);
  private readonly _pageNumber = signal(0);
  private readonly PAGE_SIZE = 20;

  // Subject нужен только для debounce поискового ввода
  private readonly searchSubject = new Subject<string>();

  /**
   * rxResource фетчит ровно одну страницу при каждом изменении params.
   * Отменяет предыдущий запрос автоматически (как switchMap).
   */
  private readonly resource = rxResource<ICategoriesListResult, ICategoriesSearchParams>({
    params: () => ({
      search: this._search(),
      sortDesc: this._sortDesc(),
      pageNumber: this._pageNumber(),
      pageSize: this.PAGE_SIZE + 1, // +1 позволяет определить наличие следующей страницы
    }),
    stream: ({ params }) => this.api.getList(params),
  });

  // Аккумулированный список — объединение всех загруженных страниц
  private readonly _items = signal<ICategory[]>([]);
  private readonly _hasMore = signal(true);
  private readonly _canEdit = signal(false);

  /** Отображаемый список (все загруженные страницы) */
  readonly items: Signal<ICategory[]> = this._items.asReadonly();
  /** Есть ли следующая страница для загрузки */
  readonly hasMore: Signal<boolean> = this._hasMore.asReadonly();
  /** Разрешено ли редактирование (из ответа сервера) */
  readonly canEdit: Signal<boolean> = this._canEdit.asReadonly();
  /** Текущее направление сортировки (true = убывание) */
  readonly sortDesc: Signal<boolean> = this._sortDesc.asReadonly();
  /** true пока идёт запрос */
  readonly isLoading: Signal<boolean> = this.resource.isLoading;

  public constructor() {
    // debounce поиска: 300 мс после последнего ввода
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((query) => this.resetWith({ search: query }));

    /**
     * Аккумулятор страниц.
     * Отслеживает resource.value() — запускается после каждой успешной загрузки.
     * pageNumber читается через untracked(), чтобы не добавлять его как реактивную
     * зависимость эффекта (избегаем цикла трекинга).
     */
    effect(() => {
      const result = this.resource.value();
      if (!result) return;

      // untracked: нам нужно текущее значение pageNumber, но не подписка на него
      const page = untracked(() => this._pageNumber());
      const hasMore = result.items.length > this.PAGE_SIZE;
      const items = hasMore ? result.items.slice(0, this.PAGE_SIZE) : result.items;

      this._hasMore.set(hasMore);
      this._canEdit.set(result.canEdit);

      if (page === 0) {
        // Новый поиск или сброс сортировки — заменяем список
        this._items.set(items);
      } else {
        // Подгрузка следующей страницы — добавляем в конец
        this._items.update((list) => [...list, ...items]);
      }
    });
  }

  /** Запустить поиск с debounce 300 мс; сбрасывает список и пагинацию */
  public search(query: string): void {
    this.searchSubject.next(query);
  }

  /** Переключить направление сортировки; сбрасывает список и пагинацию */
  public toggleSort(): void {
    this.resetWith({ sortDesc: !this._sortDesc() });
  }

  /** Загрузить следующую страницу (только если есть данные и нет активного запроса) */
  public loadMore(): void {
    if (this._hasMore() && !this.isLoading()) {
      this._pageNumber.update((n) => n + 1);
    }
  }

  /** Создать категорию; добавляет результат в начало списка */
  public add(form: ICategoryForm): Observable<ICategory> {
    return this.api.create(form).pipe(
      tap((created) => this._items.update((list) => [created, ...list])),
    );
  }

  /** Обновить категорию; заменяет запись в списке по id */
  public update(id: number, form: ICategoryForm): Observable<ICategory> {
    return this.api.update(id, form).pipe(
      tap((updated) =>
        this._items.update((list) => list.map((i) => (i.id === updated.id ? updated : i))),
      ),
    );
  }

  /** Удалить категорию; убирает запись из списка */
  public delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => this._items.update((list) => list.filter((i) => i.id !== id))),
    );
  }

  /**
   * Сбросить пагинацию и применить новые параметры фильтрации.
   * Все изменения сигналов внутри одной функции Angular батчит —
   * rxResource получает ровно один новый params и делает один запрос.
   */
  private resetWith(patch: { search?: string; sortDesc?: boolean }): void {
    if (patch.search !== undefined) this._search.set(patch.search);
    if (patch.sortDesc !== undefined) this._sortDesc.set(patch.sortDesc);
    this._pageNumber.set(0);
    this._items.set([]);
    this._hasMore.set(true);
  }
}
```

- [ ] **Step 2: Запустить тесты сервиса**

```bash
npx ng test --include="src/features/feature-categories/pages/category-list-page/services/category-list/category-list.service.spec.ts"
```

Ожидаемый результат: все тесты PASS.

- [ ] **Step 3: Прогнать линтер**

```bash
npm run lint -- --fix
```

Ожидаемый результат: нет ошибок.

- [ ] **Step 4: Коммит**

```bash
git add src/features/feature-categories/pages/category-list-page/services/
git commit -m "feat(categories): implement CategoryListService with rxResource + pagination"
```

---

## Task 3: Обновить `CategoryListPageComponent`

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts`

- [ ] **Step 1: Переписать компонент**

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { filter, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { ButtonComponent } from '@shared/ui-kit/button';
import { IconComponent } from '@shared/ui-kit/icon';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormsModule } from '@angular/forms';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';
import type { ICategory } from '@shared/api/categories';
import { CategoryListService } from './services/category-list/category-list.service';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, IconComponent, SearchInputComponent, FormsModule],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryListService],
})
export class CategoryListPageComponent {
  private readonly service = inject(CategoryListService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);
  // DestroyRef нужен явно: takeUntilDestroyed() вызывается внутри методов, вне injection context
  private readonly destroyRef = inject(DestroyRef);

  // Сигналы для шаблона пробрасываются напрямую из сервиса
  protected readonly items = this.service.items;
  protected readonly isLoading = this.service.isLoading;
  protected readonly canEdit = this.service.canEdit;
  protected readonly sortDesc = this.service.sortDesc;

  // searchValue нужен шаблону для привязки ngModel
  protected searchValue = '';

  protected onSearchChange(value: string): void {
    this.searchValue = value;
    this.service.search(value);
  }

  protected onSortToggle(): void {
    this.service.toggleSort();
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom) this.service.loadMore();
  }

  protected onAdd(): void {
    this.modalService
      .open<ICategoryForm, null>(CategoryFormDialogComponent, null)
      .pipe(filter(Boolean), switchMap((form) => this.service.add(form)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected onEdit(category: ICategory): void {
    this.modalService
      .open<ICategoryForm, ICategory>(CategoryFormDialogComponent, category)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.service.update(category.id, form)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm({ description: 'Sure to delete this element?' })
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(category.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
```

- [ ] **Step 2: Обновить шаблон — заменить `[ngModel]="searchValue()"` на `[ngModel]="searchValue"`**

В файле `src/features/feature-categories/pages/category-list-page/category-list-page.component.html` найти строку:

```html
    [ngModel]="searchValue()"
```

Заменить на:

```html
    [ngModel]="searchValue"
```

(было сигналом, стало обычным свойством)

- [ ] **Step 3: Запустить линтер**

```bash
npm run lint -- --fix
```

Ожидаемый результат: нет ошибок.

- [ ] **Step 4: Коммит**

```bash
git add src/features/feature-categories/pages/category-list-page/category-list-page.component.ts
git add src/features/feature-categories/pages/category-list-page/category-list-page.component.html
git commit -m "refactor(categories): slim down CategoryListPageComponent, delegate data to CategoryListService"
```

---

## Task 4: Обновить спецификацию компонента

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts`

- [ ] **Step 1: Переписать спецификацию компонента**

Компонент теперь UI-обёртка. Тесты проверяют, что он правильно делегирует вызовы сервису и открывает диалоги.

```ts
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { ModalService } from '@shared/ui-kit/modal';
import type { ICategory } from '@shared/api/categories';
import { CategoryListService } from './services/category-list/category-list.service';
import { CategoryListPageComponent } from './category-list-page.component';

const cat = (id: number, name = `Cat${id}`): ICategory => ({ id, name });

describe('CategoryListPageComponent', () => {
  const serviceStub: {
    items: ReturnType<typeof signal<ICategory[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    canEdit: ReturnType<typeof signal<boolean>>;
    sortDesc: ReturnType<typeof signal<boolean>>;
    hasMore: ReturnType<typeof signal<boolean>>;
    search: Mock;
    toggleSort: Mock;
    loadMore: Mock;
    add: Mock;
    update: Mock;
    delete: Mock;
  } = {
    items: signal<ICategory[]>([]),
    isLoading: signal(false),
    canEdit: signal(false),
    sortDesc: signal(false),
    hasMore: signal(true),
    search: vi.fn(),
    toggleSort: vi.fn(),
    loadMore: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const confirmationStub = { confirm: vi.fn() };
  const modalStub = { open: vi.fn() };

  function createComponent(): ReturnType<typeof TestBed.createComponent<CategoryListPageComponent>> {
    TestBed.configureTestingModule({
      imports: [CategoryListPageComponent],
      providers: [
        { provide: CategoryListService, useValue: serviceStub },
        { provide: ConfirmationService, useValue: confirmationStub },
        { provide: ModalService, useValue: modalStub },
      ],
    }).overrideComponent(CategoryListPageComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    });
    return TestBed.createComponent(CategoryListPageComponent);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    serviceStub.items.set([]);
    serviceStub.sortDesc.set(false);
    serviceStub.canEdit.set(false);
  });

  it('отображает элементы из сервиса', () => {
    serviceStub.items.set([cat(1), cat(2)]);
    const fixture = createComponent();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr.category-list-page__row');
    expect(rows.length).toBe(2);
  });

  it('onSearchChange передаёт строку в service.search()', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onSearchChange']('foo');
    expect(serviceStub.search).toHaveBeenCalledWith('foo');
  });

  it('onSortToggle вызывает service.toggleSort()', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onSortToggle']();
    expect(serviceStub.toggleSort).toHaveBeenCalled();
  });

  it('onScroll вызывает service.loadMore() при прокрутке к низу', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    const fakeEl = { scrollTop: 900, clientHeight: 100, scrollHeight: 1000 } as HTMLElement;
    fixture.componentInstance['onScroll']({ target: fakeEl } as unknown as Event);
    expect(serviceStub.loadMore).toHaveBeenCalled();
  });

  it('onAdd открывает диалог и вызывает service.add()', async () => {
    modalStub.open.mockReturnValue(of({ name: 'New', description: '' }));
    serviceStub.add.mockReturnValue(of(cat(99)));
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onAdd']();
    await Promise.resolve();
    expect(serviceStub.add).toHaveBeenCalledWith({ name: 'New', description: '' });
  });

  it('onEdit открывает диалог с данными категории и вызывает service.update()', async () => {
    const original = cat(1, 'Old');
    modalStub.open.mockReturnValue(of({ name: 'Updated', description: '' }));
    serviceStub.update.mockReturnValue(of(cat(1, 'Updated')));
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onEdit'](original);
    await Promise.resolve();
    expect(serviceStub.update).toHaveBeenCalledWith(1, { name: 'Updated', description: '' });
  });

  it('onDelete запрашивает подтверждение и вызывает service.delete()', async () => {
    const item = cat(1);
    confirmationStub.confirm.mockReturnValue(of(true));
    serviceStub.delete.mockReturnValue(of(void 0));
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onDelete'](item);
    await Promise.resolve();
    expect(serviceStub.delete).toHaveBeenCalledWith(1);
  });

  it('onDelete не вызывает service.delete() при отмене подтверждения', async () => {
    confirmationStub.confirm.mockReturnValue(of(false));
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['onDelete'](cat(1));
    await Promise.resolve();
    expect(serviceStub.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Запустить тесты компонента**

```bash
npx ng test --include="src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts"
```

Ожидаемый результат: все тесты PASS.

- [ ] **Step 3: Прогнать все тесты фичи**

```bash
npx ng test --include="src/features/feature-categories/**/*.spec.ts"
```

Ожидаемый результат: все PASS.

- [ ] **Step 4: Коммит**

```bash
git add src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts
git commit -m "test(categories): update CategoryListPage spec to mock CategoryListService"
```

---

## Task 5: Финальная проверка

- [ ] **Step 1: Прогнать все тесты проекта**

```bash
npm test
```

Ожидаемый результат: все PASS, нет регрессий.

- [ ] **Step 2: Запустить dev-сервер и проверить вручную**

```bash
npm start
```

Открыть `http://localhost:4200/categories`. Проверить:
- Список загружается
- Поиск работает с задержкой (~300 мс)
- Сортировка переключается
- Infinite scroll подгружает следующую страницу
- Добавление/редактирование/удаление работают

- [ ] **Step 3: Финальный коммит (если есть незакоммиченные изменения)**

```bash
git status
# если есть — добавить и закоммитить
```
