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
