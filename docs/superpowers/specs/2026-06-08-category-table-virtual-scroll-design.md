# CategoryTableComponent + CDK Virtual Scroll

**Date:** 2026-06-08  
**Branch:** feat/categories  
**Status:** Approved

## Goal

Extract the categories table from `CategoryListPageComponent` into a dedicated `CategoryTableComponent` and replace the manual DOM scroll pagination with CDK Virtual Scroll.

## Motivation

- `CategoryListPageComponent` mixes page orchestration with table rendering; extraction improves separation of concerns and testability.
- The existing `onScroll` handler is a low-level DOM event approach; `cdk-virtual-scroll-viewport` virtualizes the DOM (only visible rows rendered) and provides a clean `scrolledIndexChange` event for triggering `loadMore`.
- HTML `<table>` is incompatible with CDK virtual scroll natively → switch to div-based layout.

## Component: `CategoryTableComponent`

**Location:** `src/features/feature-categories/components/category-table/`

```
category-table/
  category-table.component.ts
  category-table.component.html
  category-table.component.scss
  index.ts
```

### Inputs

| Name        | Type          | Description                        |
|-------------|---------------|------------------------------------|
| `items`     | `ICategory[]` | Current list of items              |
| `isLoading` | `boolean`     | Whether a fetch is in progress     |
| `sortDesc`  | `boolean`     | Current sort direction             |
| `canEdit`   | `boolean`     | Whether edit/delete buttons shown  |
| `hasMore`   | `boolean`     | Whether more pages exist on server |

All inputs use Angular's `input.required<T>()` signal API.

### Outputs

| Name          | Payload     | Description                              |
|---------------|-------------|------------------------------------------|
| `sortToggle`  | `void`      | User clicked a sortable column header    |
| `edit`        | `ICategory` | User clicked edit on a row               |
| `delete`      | `ICategory` | User clicked delete on a row             |
| `loadMore`    | `void`      | Viewport scrolled near end of list       |

### Template structure

```
.category-table (host / wrapper)
  .category-table__head          ← fixed header row (outside viewport)
    .category-table__col-name    ← "Name" sortable
    .category-table__col-desc    ← "Description" sortable
    .category-table__col-actions ← empty
  cdk-virtual-scroll-viewport    ← scroll container
    .category-table__row × N     (*cdkVirtualFor)
      .category-table__col-name
      .category-table__col-desc
      .category-table__col-actions (edit + delete buttons when canEdit)
  .category-table__loading       ← @if isLoading
  .category-table__empty         ← @if !isLoading && items.length === 0
```

### loadMore trigger logic

```ts
protected onScrolledIndex(firstVisible: number): void {
  if (this.hasMore() && !this.isLoading()) {
    const threshold = this.items().length - PAGE_SIZE / 2;
    if (firstVisible >= threshold) {
      this.loadMore.emit();
    }
  }
}
```

`PAGE_SIZE = 10` (half the service page size) — gives comfortable fetch-ahead buffer.

### itemSize

Row height = `49px` (12px top padding + 12px bottom padding + ~25px one line of text). Confirmed by inspecting existing SCSS.  
`<cdk-virtual-scroll-viewport itemSize="49">`.

## Changes to `CategoryListPageComponent`

- Remove `onScroll(event)` method.
- Remove `(scroll)` binding and `__table-container` div.
- Remove `IconComponent` import (moved to table component).
- Add `CategoryTableComponent` to imports.
- Replace table markup with:

```html
<app-category-table
  [items]="items()"
  [isLoading]="isLoading()"
  [sortDesc]="sortDesc()"
  [canEdit]="canEdit()"
  [hasMore]="hasMore()"
  (sortToggle)="onSortToggle()"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
  (loadMore)="listService.loadMore()"
/>
```

- SCSS: remove all `__table*`, `__row`, `__sortable`, `__sort-icon`, `__col-*`, `__icon-btn*`, `__loading`, `__empty` blocks.

## SCSS approach

- `.category-table` uses `display: flex; flex-direction: column; height: 100%`.
- `.category-table__head` + rows use CSS Grid with same column template:  
  `grid-template-columns: 1fr 1fr 72px`.
- `cdk-virtual-scroll-viewport` gets `flex: 1; min-height: 0` so it fills remaining space.

## Dependencies

- `@angular/cdk/scrolling` — `ScrollingModule` (already in package.json via `@angular/cdk`).
- No new packages needed.

## Testing

- `CategoryTableComponent` spec: test that `loadMore` emits when `scrolledIndexChange` fires near end; test that `edit`/`delete`/`sortToggle` emit on click; test empty/loading states render.
- `CategoryListPageComponent` spec: update to remove scroll-related tests; add binding test for `(loadMore)`.

## Out of scope

- Changing server pagination logic (`CategoryListService` is untouched).
- Row height measurement / dynamic `itemSize` — fixed `49px` is sufficient.
- Accessibility improvements beyond what already exists.
