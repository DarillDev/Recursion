import { Injectable, computed, inject, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import {
  Subject,
  catchError,
  defer,
  exhaustMap,
  finalize,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import {
  CategoriesApiService,
  type ICategoriesListResult,
  type ICategory,
} from '@shared/api/categories';
import { ICategoryForm } from '../../../../interfaces/category-form.interface';
import type { TSort } from '../../../../models/types/sort.type';

@Injectable()
export class CategoryListService {
  private readonly api = inject(CategoriesApiService);
  private readonly PAGE_SIZE = 20;

  private readonly _params = signal<{
    search: string;
    sort: TSort | undefined;
    pageNumber: number;
    pageSize: number;
  }>({
    search: '',
    sort: undefined,
    pageNumber: 0,
    pageSize: this.PAGE_SIZE,
  });

  private readonly _items = signal<ICategory[]>([]);
  private readonly _hasMore = signal(true);
  private readonly _canEdit = signal(false);
  private readonly _isLoading = signal(false);

  public readonly items: Signal<ICategory[]> = this._items.asReadonly();
  public readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  public readonly hasMore: Signal<boolean> = this._hasMore.asReadonly();
  public readonly canEdit: Signal<boolean> = this._canEdit.asReadonly();
  public readonly sort = computed(() => this._params().sort);

  private readonly reset$ = new Subject<void>();
  private readonly loadMore$ = new Subject<void>();
  private readonly cancelLoadMore$ = new Subject<void>();

  constructor() {
    this._initSubscription();
  }

  private _initSubscription(): void {
    // Смена параметров: отменяет текущую загрузку и начинает новый запрос
    const loadingData$ = this.reset$.pipe(
      tap(() => this.cancelLoadMore$.next()),
      switchMap(() => this.fetchSource(false)),
    );
    // Подгрузка страниц: игнорирует новые вызовы пока идёт запрос
    const uploadingData$ = this.loadMore$.pipe(
      exhaustMap(() => this.fetchSource(true).pipe(takeUntil(this.cancelLoadMore$))),
    );

    loadingData$.pipe(takeUntilDestroyed()).subscribe();
    uploadingData$.pipe(takeUntilDestroyed()).subscribe();

    this.reset$.next();
  }

  /** Обновить параметры запроса; сбрасывает список и пагинацию */
  public updateParams(patch: { search?: string }): void {
    this._params.update((params) => ({ ...params, ...patch, pageNumber: 0 }));
    this._hasMore.set(true);
    this.reset$.next();
  }

  /** Алиас для обновления поискового запроса */
  public search(query: string): void {
    this.updateParams({ search: query });
  }

  /** Переключает сортировку по циклу: нет → asc → desc → нет.
   *  Клик по другому полю сбрасывает до asc. */
  public toggleSort(field: 'id' | 'name'): void {
    const current = this._params().sort;
    const isSameField = current?.field === field;
    const currentDir = isSameField ? current?.dir : undefined;
    const nextDir = currentDir === undefined ? 'asc' : currentDir === 'asc' ? 'desc' : undefined;

    this._params.update((params) => ({
      ...params,
      sort: nextDir === undefined ? undefined : { field, dir: nextDir },
      pageNumber: 0,
    }));
    this._hasMore.set(true);
    this.reset$.next();
  }

  /** Загрузить следующую страницу */
  public loadMore(): void {
    if (this._hasMore() && !this.isLoading()) {
      this._params.update((params) => ({ ...params, pageNumber: params.pageNumber + 1 }));
      this.loadMore$.next();
    }
  }

  /** Создать категорию; добавляет результат в начало списка */
  public add(form: ICategoryForm): Observable<ICategory> {
    return this.api.create(form).pipe(
      tap((newItem) => {
        if (newItem?.id) {
          this._items.update((list) => [newItem, ...list]);
        } else {
          this._reload();
        }
      }),
    );
  }

  /** Обновить категорию; заменяет запись в списке по id */
  public update(updated: ICategory, isOptimistic: boolean = true): Observable<ICategory> {
    const request$ = this.api.update(updated.id, { name: updated.name });

    if (!isOptimistic) {
      return request$.pipe(finalize(() => this._reload()));
    }

    return defer(() => {
      this._items.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));

      return request$.pipe(
        catchError((error) => {
          this._reload();

          return throwError(() => error);
        }),
      );
    });
  }

  /** Удалить категорию; убирает запись из списка */
  public delete(id: number, isOptimistic: boolean = true): Observable<void> {
    const request$ = this.api.delete(id);

    if (!isOptimistic) {
      return request$.pipe(finalize(() => this._reload()));
    }

    return defer(() => {
      this._items.update((list) => list.filter((item) => item.id !== id));

      return request$.pipe(
        catchError((error) => {
          this._reload();

          return throwError(() => error);
        }),
      );
    });
  }

  private _reload(): void {
    this._params.update((params) => ({ ...params, pageNumber: 0 }));
    this._hasMore.set(true);
    this.reset$.next();
  }

  private fetchSource(forUpdate: boolean): Observable<ICategoriesListResult> {
    return defer(() => {
      this._isLoading.set(true);

      const { search, sort, pageNumber, pageSize } = this._params();
      const apiParams = {
        search,
        pageNumber,
        pageSize: pageSize + 1,
        ...(sort && { sortField: sort.field, sortDesc: sort.dir === 'desc' }),
      };

      return this.api.getList(apiParams).pipe(
        tap((result) => {
          const hasMore = apiParams.pageSize <= result.items.length;
          const items = hasMore ? result.items.slice(0, pageSize) : result.items;

          this._hasMore.set(hasMore);
          this._canEdit.set(result.canEdit);

          if (forUpdate) {
            this._items.update((list) => [...list, ...items]);
          } else {
            this._items.set(items);
          }
        }),
        finalize(() => this._isLoading.set(false)),
      );
    });
  }
}
