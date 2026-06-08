import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChangeDetectorRef, NgZone } from '@angular/core';
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
  const items = overrides.items ?? [];
  const fixture = TestBed.createComponent(CategoryTableComponent);
  fixture.componentRef.setInput('items', items);
  fixture.componentRef.setInput('isLoading', overrides.isLoading ?? false);
  fixture.componentRef.setInput('sortDesc', overrides.sortDesc ?? false);
  fixture.componentRef.setInput('canEdit', overrides.canEdit ?? true);
  fixture.componentRef.setInput('hasMore', overrides.hasMore ?? false);
  fixture.detectChanges();

  // JSDOM has no layout engine so cdk-virtual-scroll-viewport measures 0px height
  // and renders nothing. Force it to render all items directly.
  const vpDe = fixture.debugElement.query(By.directive(CdkVirtualScrollViewport));
  if (vpDe && items.length > 0) {
    const vp = vpDe.componentInstance as CdkVirtualScrollViewport;
    const zone = TestBed.inject(NgZone);
    zone.run(() => {
      vp.setTotalContentSize(items.length * 49);
      vp.setRenderedRange({ start: 0, end: items.length });
    });
    // setRenderedRange schedules markForCheck via a microtask (Promise.resolve).
    // Marking the root CDR for check explicitly ensures OnPush re-enters the view,
    // so CdkVirtualForOf.ngDoCheck runs and renders items into the DOM.
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
  }

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
