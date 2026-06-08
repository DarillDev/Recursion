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
import type { ICategoryForm } from '../../../../interfaces/category-form.interface';
import type { ISort } from '../../../../models/interfaces/sort.interface';

interface IListParams {
  search: string;
  sort: ISort | undefined;
  pageNumber: number;
  pageSize: number;
}

@Injectable()
export class CategoryListService {
  private readonly api = inject(CategoriesApiService);
  private readonly PAGE_SIZE = 20;

  private readonly _params = signal<IListParams>({
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
    const loadingData$ = this.reset$.pipe(
      tap(() => this.cancelLoadMore$.next()),
      switchMap(() => this.fetchSource(false)),
    );
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

  /** Создать категорию */
  public add(form: ICategoryForm): Observable<ICategory> {
    return this.api.create(form).pipe(
      tap(() => {
        this.updateParams({});
      }),
    );
  }

  /** Обновить категорию; заменяет запись в списке по id */
  public update(updated: ICategory, isOptimistic = true): Observable<ICategory> {
    const request$ = this.api.update(updated.id, { name: updated.name });

    if (!isOptimistic) {
      return request$.pipe(finalize(() => this.updateParams({})));
    }

    return this._optimisticUpdate(
      () =>
        this._items.update((list) => list.map((item) => (item.id === updated.id ? updated : item))),
      request$,
    );
  }

  /** Удалить категорию; убирает запись из списка */
  public delete(id: number, isOptimistic = true): Observable<void> {
    const request$ = this.api.delete(id);

    if (!isOptimistic) {
      return request$.pipe(finalize(() => this.updateParams({})));
    }

    return this._optimisticUpdate(
      () => this._items.update((list) => list.filter((item) => item.id !== id)),
      request$,
    );
  }

  private _optimisticUpdate<T>(apply: () => void, request$: Observable<T>): Observable<T> {
    return defer(() => {
      apply();

      return request$.pipe(
        catchError((error) => {
          this.updateParams({});

          return throwError(() => error);
        }),
      );
    });
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
