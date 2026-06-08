import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoriesService } from '@shared/api/categories';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { ModalService } from '@shared/ui-kit/modal';
import type { ICategory } from '@shared/api/categories';
import { CategoryListPageComponent } from './category-list-page.component';

const mockCategory = (id: string, name: string, canEdit = true): ICategory => ({
  id, name, canEdit,
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

  function createComponent() {
    TestBed.configureTestingModule({
      imports: [CategoryListPageComponent],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceStub },
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
    categoriesServiceStub.getList.mockReturnValue(of([]));
    createComponent();
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 21,
      search: '',
      sortDesc: false,
    });
  });

  it('sets hasMore to false when page returns less than PAGE_SIZE items', () => {
    const items = Array.from({ length: 5 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(false);
  });

  it('sets hasMore to true when page returns PAGE_SIZE+1 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(true);
  });

  it('shows only PAGE_SIZE items when 21 returned', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['items']().length).toBe(20);
  });

  it('resets list and reloads on search change', async () => {
    vi.useFakeTimers();
    const page1 = [mockCategory('1', 'Apple')];
    categoriesServiceStub.getList.mockReturnValue(of(page1));
    const fixture = createComponent();
    const searchPage = [mockCategory('2', 'Avocado')];
    categoriesServiceStub.getList.mockReturnValue(of(searchPage));
    fixture.componentInstance['onSearchChange']('Av');
    await vi.advanceTimersByTimeAsync(300);
    expect(fixture.componentInstance['items']()).toEqual(searchPage);
    vi.useRealTimers();
  });

  it('toggles sortDesc and reloads', () => {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    const fixture = createComponent();
    expect(fixture.componentInstance['sortDesc']()).toBe(false);
    fixture.componentInstance['onSortToggle']();
    expect(fixture.componentInstance['sortDesc']()).toBe(true);
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith(
      expect.objectContaining({ sortDesc: true }),
    );
  });

  it('opens CategoryFormDialog on add and creates item', async () => {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    const fixture = createComponent();
    const newItem = mockCategory('99', 'New');
    modalServiceStub.open.mockReturnValue(of({ name: 'New' }));
    categoriesServiceStub.create.mockReturnValue(of(newItem));
    fixture.componentInstance['onAdd']();
    await Promise.resolve();
    expect(categoriesServiceStub.create).toHaveBeenCalledWith({ name: 'New' });
    expect(fixture.componentInstance['items']()).toContain(newItem);
  });

  it('opens CategoryFormDialog on edit and updates item', async () => {
    const original = mockCategory('1', 'Old');
    categoriesServiceStub.getList.mockReturnValue(of([original]));
    const fixture = createComponent();
    const updated = mockCategory('1', 'Updated');
    modalServiceStub.open.mockReturnValue(of({ name: 'Updated' }));
    categoriesServiceStub.update.mockReturnValue(of(updated));
    fixture.componentInstance['onEdit'](original);
    await Promise.resolve();
    expect(fixture.componentInstance['items']()[0]).toEqual(updated);
  });

  it('deletes item after confirmation', async () => {
    const item = mockCategory('1', 'ToDelete');
    categoriesServiceStub.getList.mockReturnValue(of([item]));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(true));
    categoriesServiceStub.delete.mockReturnValue(of(void 0));
    fixture.componentInstance['onDelete'](item);
    await Promise.resolve();
    expect(fixture.componentInstance['items']()).not.toContain(item);
  });

  it('does not delete when confirmation is false', async () => {
    const item = mockCategory('1', 'Keep');
    categoriesServiceStub.getList.mockReturnValue(of([item]));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(false));
    fixture.componentInstance['onDelete'](item);
    await Promise.resolve();
    expect(categoriesServiceStub.delete).not.toHaveBeenCalled();
  });
});
