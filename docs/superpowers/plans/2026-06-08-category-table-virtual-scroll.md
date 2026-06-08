# CategoryTableComponent + CDK Virtual Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the categories table into a standalone `CategoryTableComponent` with CDK virtual scroll (div-based layout), and wire it into the existing `CategoryListPageComponent`.

**Architecture:** A new "dumb" presentational component receives all data via `input()` signals and emits user actions via `output()`. The page component remains the owner of `CategoryListService` and passes signals down. CDK's `scrolledIndexChange` event replaces the current DOM `scroll` listener for triggering server-side `loadMore`.

**Tech Stack:** Angular 21 standalone, `@angular/cdk/scrolling` (`CdkVirtualScrollViewport`, `CdkVirtualForOf`), Vitest.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/features/feature-categories/components/category-table/category-table.component.ts` |
| Create | `src/features/feature-categories/components/category-table/category-table.component.html` |
| Create | `src/features/feature-categories/components/category-table/category-table.component.scss` |
| Create | `src/features/feature-categories/components/category-table/category-table.component.spec.ts` |
| Create | `src/features/feature-categories/components/category-table/index.ts` |
| Modify | `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts` |
| Modify | `src/features/feature-categories/pages/category-list-page/category-list-page.component.html` |
| Modify | `src/features/feature-categories/pages/category-list-page/category-list-page.component.scss` |
| Modify | `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts` |

---

## Task 1: CategoryTableComponent — skeleton + spec scaffold

**Files:**
- Create: `src/features/feature-categories/components/category-table/category-table.component.ts`
- Create: `src/features/feature-categories/components/category-table/category-table.component.spec.ts`

- [ ] **Step 1: Create the component skeleton**

`src/features/feature-categories/components/category-table/category-table.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { IconComponent } from '@shared/ui-kit/icon';
import type { ICategory } from '@shared/api/categories';

const LOAD_MORE_THRESHOLD = 5;

@Component({
  selector: 'app-category-table',
  imports: [CdkVirtualScrollViewport, CdkVirtualForOf, IconComponent],
  templateUrl: './category-table.component.html',
  styleUrl: './category-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTableComponent {
  public readonly items = input.required<ICategory[]>();
  public readonly isLoading = input.required<boolean>();
  public readonly sortDesc = input.required<boolean>();
  public readonly canEdit = input.required<boolean>();
  public readonly hasMore = input.required<boolean>();

  public readonly sortToggle = output<void>();
  public readonly edit = output<ICategory>();
  public readonly delete = output<ICategory>();
  public readonly loadMore = output<void>();

  protected onScrolledIndex(firstVisible: number): void {
    if (this.hasMore() && !this.isLoading()) {
      if (firstVisible >= this.items().length - LOAD_MORE_THRESHOLD) {
        this.loadMore.emit();
      }
    }
  }
}
```

- [ ] **Step 2: Write the failing spec**

`src/features/feature-categories/components/category-table/category-table.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { CategoryTableComponent } from './category-table.component';
import type { ICategory } from '@shared/api/categories';

const cat = (id: number, name = `Cat${id}`): ICategory => ({ id, name });

function createFixture(
  overrides: Partial<{
    items: ICategory[];
    isLoading: boolean;
    sortDesc: boolean;
    canEdit: boolean;
    hasMore: boolean;
  }> = {},
): ComponentFixture<CategoryTableComponent> {
  const fixture = TestBed.createComponent(CategoryTableComponent);
  fixture.componentRef.setInput('items', overrides.items ?? []);
  fixture.componentRef.setInput('isLoading', overrides.isLoading ?? false);
  fixture.componentRef.setInput('sortDesc', overrides.sortDesc ?? false);
  fixture.componentRef.setInput('canEdit', overrides.canEdit ?? true);
  fixture.componentRef.setInput('hasMore', overrides.hasMore ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('CategoryTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryTableComponent],
    }).compileComponents();
  });

  it('emits sortToggle when name header is clicked', () => {
    const fixture = createFixture();
    let emitted = false;
    fixture.componentInstance.sortToggle.subscribe(() => (emitted = true));
    const header = fixture.nativeElement.querySelector('[data-testid="sort-name"]') as HTMLElement;
    header.click();
    expect(emitted).toBe(true);
  });

  it('emits edit with the item when edit button is clicked', () => {
    const item = cat(1, 'Apple');
    const fixture = createFixture({ items: [item], canEdit: true });
    let received: ICategory | undefined;
    fixture.componentInstance.edit.subscribe((v) => (received = v));
    const btn = fixture.nativeElement.querySelector('[data-testid="edit-1"]') as HTMLElement;
    btn.click();
    expect(received).toEqual(item);
  });

  it('emits delete with the item when delete button is clicked', () => {
    const item = cat(2, 'Banana');
    const fixture = createFixture({ items: [item], canEdit: true });
    let received: ICategory | undefined;
    fixture.componentInstance.delete.subscribe((v) => (received = v));
    const btn = fixture.nativeElement.querySelector('[data-testid="delete-2"]') as HTMLElement;
    btn.click();
    expect(received).toEqual(item);
  });

  it('does not render edit/delete when canEdit is false', () => {
    const fixture = createFixture({ items: [cat(1)], canEdit: false });
    expect(fixture.nativeElement.querySelector('[data-testid="edit-1"]')).toBeNull();
  });

  it('shows loading indicator when isLoading is true', () => {
    const fixture = createFixture({ isLoading: true });
    expect(fixture.nativeElement.querySelector('[data-testid="loading"]')).not.toBeNull();
  });

  it('shows empty state when items is empty and not loading', () => {
    const fixture = createFixture({ items: [], isLoading: false });
    expect(fixture.nativeElement.querySelector('[data-testid="empty"]')).not.toBeNull();
  });

  it('emits loadMore when scrolledIndex reaches threshold', () => {
    const items = Array.from({ length: 20 }, (_, i) => cat(i));
    const fixture = createFixture({ items, hasMore: true, isLoading: false });
    let emitted = false;
    fixture.componentInstance.loadMore.subscribe(() => (emitted = true));
    fixture.componentInstance['onScrolledIndex'](15); // 20 - 5 = 15
    expect(emitted).toBe(true);
  });

  it('does not emit loadMore when hasMore is false', () => {
    const items = Array.from({ length: 20 }, (_, i) => cat(i));
    const fixture = createFixture({ items, hasMore: false, isLoading: false });
    let emitted = false;
    fixture.componentInstance.loadMore.subscribe(() => (emitted = true));
    fixture.componentInstance['onScrolledIndex'](15);
    expect(emitted).toBe(false);
  });

  it('does not emit loadMore when isLoading is true', () => {
    const items = Array.from({ length: 20 }, (_, i) => cat(i));
    const fixture = createFixture({ items, hasMore: true, isLoading: true });
    let emitted = false;
    fixture.componentInstance.loadMore.subscribe(() => (emitted = true));
    fixture.componentInstance['onScrolledIndex'](15);
    expect(emitted).toBe(false);
  });
});
```

- [ ] **Step 3: Run spec to verify it fails (component exists but template is missing)**

```bash
npx ng test --include="src/features/feature-categories/components/category-table/category-table.component.spec.ts"
```

Expected: compile error or failing tests because template file doesn't exist yet.

---

## Task 2: HTML template + SCSS

**Files:**
- Create: `src/features/feature-categories/components/category-table/category-table.component.html`
- Create: `src/features/feature-categories/components/category-table/category-table.component.scss`

- [ ] **Step 1: Create the template**

`src/features/feature-categories/components/category-table/category-table.component.html`:
```html
<div class="category-table">
  <div class="category-table__head">
    <div
      class="category-table__col-name category-table__sortable"
      data-testid="sort-name"
      (click)="sortToggle.emit()"
    >
      Name
      <span class="category-table__sort-icon">{{ sortDesc() ? '↓' : '↑' }}</span>
    </div>
    <div
      class="category-table__col-desc category-table__sortable"
      data-testid="sort-desc"
      (click)="sortToggle.emit()"
    >
      Description
    </div>
    <div class="category-table__col-actions"></div>
  </div>

  <cdk-virtual-scroll-viewport
    class="category-table__viewport"
    itemSize="49"
    (scrolledIndexChange)="onScrolledIndex($event)"
  >
    <div
      class="category-table__row"
      *cdkVirtualFor="let item of items()"
      (click)="canEdit() && edit.emit(item)"
    >
      <div class="category-table__col-name">{{ item.name }}</div>
      <div class="category-table__col-desc">{{ item.description }}</div>
      <div class="category-table__col-actions">
        @if (canEdit()) {
          <button
            class="category-table__icon-btn category-table__icon-btn--edit"
            [attr.data-testid]="'edit-' + item.id"
            title="Редактировать"
            (click)="edit.emit(item); $event.stopPropagation()"
          >
            <ui-kit-icon name="edit" [size]="16" />
          </button>
          <button
            class="category-table__icon-btn category-table__icon-btn--delete"
            [attr.data-testid]="'delete-' + item.id"
            title="Удалить"
            (click)="delete.emit(item); $event.stopPropagation()"
          >
            <ui-kit-icon name="delete" [size]="16" />
          </button>
        }
      </div>
    </div>
  </cdk-virtual-scroll-viewport>

  @if (isLoading()) {
    <div class="category-table__loading" data-testid="loading">Загрузка...</div>
  }

  @if (!isLoading() && items().length === 0) {
    <div class="category-table__empty" data-testid="empty">Записей не найдено</div>
  }
</div>
```

- [ ] **Step 2: Create SCSS**

`src/features/feature-categories/components/category-table/category-table.component.scss`:
```scss
$col-template: 1fr 1fr 80px;

.category-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;

  &__head {
    display: grid;
    grid-template-columns: $col-template;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    > div {
      padding: 12px 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  &__viewport {
    flex: 1;
    min-height: 0;
  }

  &__row {
    display: grid;
    grid-template-columns: $col-template;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    height: 49px;

    &:last-child {
      border-bottom: none;
    }

    &:hover > div {
      background: var(--color-bg-hover);
    }

    > div {
      padding: 12px 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
    }
  }

  &__sortable {
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__sort-icon {
    margin-left: 4px;
  }

  &__col-actions {
    justify-content: flex-end;
    gap: 4px;
  }

  &__icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--delete:hover {
      color: var(--color-danger);
    }
  }

  &__loading,
  &__empty {
    padding: 24px;
    text-align: center;
    color: var(--color-text-secondary);
  }
}
```

- [ ] **Step 3: Run the spec — all tests should pass**

```bash
npx ng test --include="src/features/feature-categories/components/category-table/category-table.component.spec.ts"
```

Expected: all 8 tests PASS.

---

## Task 3: Barrel export

**Files:**
- Create: `src/features/feature-categories/components/category-table/index.ts`

- [ ] **Step 1: Create index.ts**

`src/features/feature-categories/components/category-table/index.ts`:
```ts
export { CategoryTableComponent } from './category-table.component';
```

- [ ] **Step 2: Commit task 2–3**

```bash
git add src/features/feature-categories/components/category-table/
git commit -m "feat(categories): add CategoryTableComponent with CDK virtual scroll"
```

---

## Task 4: Update CategoryListPageComponent — template

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.html`

- [ ] **Step 1: Replace table markup with `<app-category-table>`**

Replace the entire content of `category-list-page.component.html` with:
```html
<div class="category-list-page">
  <div class="category-list-page__header">
    <h1 class="category-list-page__title">Categories</h1>
    @if (canEdit()) {
      <ui-kit-button variant="primary" (click)="onAdd()">+ Add</ui-kit-button>
    }
  </div>

  <ui-kit-search-input
    class="category-list-page__search"
    placeholder="Search"
    [formControl]="searchControl"
  />

  <app-category-table
    class="category-list-page__table"
    [items]="items()"
    [isLoading]="isLoading()"
    [sortDesc]="sortDesc()"
    [canEdit]="canEdit()"
    [hasMore]="hasMore()"
    (sortToggle)="onSortToggle()"
    (edit)="onEdit($event)"
    (delete)="onDelete($event)"
    (loadMore)="onLoadMore()"
  />
</div>
```

---

## Task 5: Update CategoryListPageComponent — TypeScript

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts`

- [ ] **Step 1: Update component TS**

Replace the full content of `category-list-page.component.ts` with:
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, filter, skip, switchMap } from 'rxjs';
import type { ICategory } from '@shared/api/categories';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import type { ICategoryForm } from '../../interfaces/category-form.interface';
import { ButtonComponent } from '@shared/ui-kit/button';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CategoryListService } from './services/category-list/category-list.service';
import { CategoryTableComponent } from '../../components/category-table';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, SearchInputComponent, ReactiveFormsModule, CategoryTableComponent],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryListService],
})
export class CategoryListPageComponent {
  private readonly listService = inject(CategoryListService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly searchQuery$ = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300)),
    { initialValue: '' },
  );
  protected readonly items = this.listService.items;
  protected readonly isLoading = this.listService.isLoading;
  protected readonly hasMore = this.listService.hasMore;
  protected readonly sortDesc = this.listService.sortDesc;
  protected readonly canEdit = this.listService.canEdit;

  constructor() {
    toObservable(this.searchQuery$).pipe(
      skip(1),
      takeUntilDestroyed(),
    ).subscribe((search) => this.listService.updateParams({ search }));
  }

  protected onSortToggle(): void {
    this.listService.updateParams({ sortDesc: !this.sortDesc() });
  }

  protected onLoadMore(): void {
    this.listService.loadMore();
  }

  protected onAdd(): void {
    this.modalService
      .open<ICategoryForm, null>(CategoryFormDialogComponent, null)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.listService.add(form)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onEdit(category: ICategory): void {
    this.modalService
      .open<ICategoryForm, ICategory>(CategoryFormDialogComponent, category)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.listService.update(category.id, form)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm({ description: 'Sure to delete this element?' })
      .pipe(
        filter(Boolean),
        switchMap(() => this.listService.delete(category.id)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
```

---

## Task 6: Update CategoryListPageComponent — SCSS

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.scss`

- [ ] **Step 1: Remove table styles, keep page layout**

Replace the full content of `category-list-page.component.scss` with:
```scss
.category-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  gap: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__search {
    width: 100%;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }
}
```

---

## Task 7: Update CategoryListPageComponent spec

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts`

The existing spec tests business logic (CRUD, search, sort) — these remain valid. Two changes needed:
1. Add `CategoryTableComponent` to imports so the test module compiles.
2. Replace the `onScroll` test (no longer exists) with an `onLoadMore` test.

- [ ] **Step 1: Update the spec**

Replace the full content of `category-list-page.component.spec.ts` with:
```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoriesApiService } from '@shared/api/categories';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { ModalService } from '@shared/ui-kit/modal';
import type { ICategory, ICategoriesListResult } from '@shared/api/categories';
import { CategoryListPageComponent } from './category-list-page.component';

const mockCategory = (id: number, name: string): ICategory => ({ id, name });
const mockListResult = (items: ICategory[], canEdit = true): ICategoriesListResult => ({
  items,
  canEdit,
});

describe('CategoryListPageComponent', () => {
  const categoriesServiceStub = {
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const confirmationServiceStub = { confirm: vi.fn() };
  const modalServiceStub = { open: vi.fn() };

  function createComponent(): ReturnType<typeof TestBed.createComponent<CategoryListPageComponent>> {
    TestBed.configureTestingModule({
      imports: [CategoryListPageComponent],
      providers: [
        { provide: CategoriesApiService, useValue: categoriesServiceStub },
        { provide: ConfirmationService, useValue: confirmationServiceStub },
        { provide: ModalService, useValue: modalServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(CategoryListPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    categoriesServiceStub.getList.mockReset();
    categoriesServiceStub.create.mockReset();
    categoriesServiceStub.update.mockReset();
    categoriesServiceStub.delete.mockReset();
    confirmationServiceStub.confirm.mockReset();
    modalServiceStub.open.mockReset();
  });

  it('loads first page on init', () => {
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([])));
    createComponent();
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 21,
      search: '',
      sortDesc: false,
    });
  });

  it('sets hasMore to false when page returns less than PAGE_SIZE items', () => {
    const items = Array.from({ length: 5 }, (_, i) => mockCategory(i, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(items)));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(false);
  });

  it('sets hasMore to true when page returns PAGE_SIZE+1 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(i, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(items)));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(true);
  });

  it('shows only PAGE_SIZE items when 21 returned', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(i, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(items)));
    const fixture = createComponent();
    expect(fixture.componentInstance['items']().length).toBe(20);
  });

  it('resets list and reloads on search change', async () => {
    vi.useFakeTimers();
    const page1 = [mockCategory(1, 'Apple')];
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(page1)));
    const fixture = createComponent();
    const searchPage = [mockCategory(2, 'Avocado')];
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(searchPage)));
    fixture.componentInstance['onSearchChange']('Av');
    await vi.advanceTimersByTimeAsync(300);
    expect(fixture.componentInstance['items']()).toEqual(searchPage);
    vi.useRealTimers();
  });

  it('toggles sortDesc and reloads', () => {
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([])));
    const fixture = createComponent();
    expect(fixture.componentInstance['sortDesc']()).toBe(false);
    fixture.componentInstance['onSortToggle']();
    expect(fixture.componentInstance['sortDesc']()).toBe(true);
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith(
      expect.objectContaining({ sortDesc: true }),
    );
  });

  it('calls listService.loadMore when onLoadMore is invoked', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(i, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(items)));
    const fixture = createComponent();
    const nextItems = Array.from({ length: 5 }, (_, i) => mockCategory(i + 21, `Cat ${i + 21}`));
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult(nextItems)));
    fixture.componentInstance['onLoadMore']();
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1 }),
    );
  });

  it('opens CategoryFormDialog on add and creates item', async () => {
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([])));
    const fixture = createComponent();
    const newItem = mockCategory(99, 'New');
    modalServiceStub.open.mockReturnValue(of({ name: 'New', description: '' }));
    categoriesServiceStub.create.mockReturnValue(of(newItem));
    fixture.componentInstance['onAdd']();
    await Promise.resolve();
    expect(categoriesServiceStub.create).toHaveBeenCalledWith({ name: 'New', description: '' });
    expect(fixture.componentInstance['items']()).toContain(newItem);
  });

  it('opens CategoryFormDialog on edit and updates item', async () => {
    const original = mockCategory(1, 'Old');
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([original])));
    const fixture = createComponent();
    const updated = mockCategory(1, 'Updated');
    modalServiceStub.open.mockReturnValue(of({ name: 'Updated', description: '' }));
    categoriesServiceStub.update.mockReturnValue(of(updated));
    fixture.componentInstance['onEdit'](original);
    await Promise.resolve();
    expect(fixture.componentInstance['items']()[0]).toEqual(updated);
  });

  it('deletes item after confirmation', async () => {
    const item = mockCategory(1, 'ToDelete');
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([item])));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(true));
    categoriesServiceStub.delete.mockReturnValue(of(void 0));
    fixture.componentInstance['onDelete'](item);
    await Promise.resolve();
    expect(fixture.componentInstance['items']()).not.toContain(item);
  });

  it('does not delete when confirmation is false', async () => {
    const item = mockCategory(1, 'Keep');
    categoriesServiceStub.getList.mockReturnValue(of(mockListResult([item])));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(false));
    fixture.componentInstance['onDelete'](item);
    await Promise.resolve();
    expect(categoriesServiceStub.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run all feature-categories specs**

```bash
npx ng test --include="src/features/feature-categories/**/*.spec.ts"
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/feature-categories/pages/category-list-page/
git commit -m "refactor(categories): replace table markup with CategoryTableComponent"
```

---

## Task 8: Smoke test in browser

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

- [ ] **Step 2: Open http://localhost:4200 and verify**

- Login and navigate to `/categories`
- Table renders with Name / Description columns and sort arrows
- Clicking column header sorts the list (arrow direction changes)
- Edit and Delete buttons appear per row
- Scrolling down in the table triggers loading indicator and appends more rows
- Edit dialog opens on row click / edit button
- Delete confirmation works
- Search input filters results

- [ ] **Step 3: Check browser console for errors**

No errors should appear in the browser console.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(categories): extract CategoryTableComponent with CDK virtual scroll"
```
