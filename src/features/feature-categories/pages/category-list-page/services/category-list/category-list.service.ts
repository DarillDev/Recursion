import { Injectable, computed, inject, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { Subject, defer, exhaustMap, finalize, switchMap, takeUntil, tap } from 'rxjs';
import {
  CategoriesApiService,
  type ICategoriesListResult,
  type ICategoriesSearchParams,
  type ICategory,
} from '@shared/api/categories';
import type { ICategoryForm } from '../../../../interfaces/category-form.interface';

@Injectable()
export class CategoryListService {
  private readonly api = inject(CategoriesApiService);
  private readonly PAGE_SIZE = 20;

  private readonly _params = signal<Required<ICategoriesSearchParams>>({
    search: '',
    sortDesc: false,
    pageNumber: 0,
    pageSize: this.PAGE_SIZE + 1,
  });

  private readonly _items = signal<ICategory[]>([]);
  private readonly _hasMore = signal(true);
  private readonly _canEdit = signal(false);
  private readonly _isLoading = signal(false);

  public readonly items: Signal<ICategory[]> = this._items.asReadonly();
  public readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  public readonly hasMore: Signal<boolean> = this._hasMore.asReadonly();
  public readonly canEdit: Signal<boolean> = this._canEdit.asReadonly();
  public readonly sortDesc = computed(() => this._params().sortDesc);

  private readonly reset$ = new Subject<void>();
  private readonly loadMore$ = new Subject<void>();
  private readonly cancelLoadMore$ = new Subject<void>();

  constructor() {
    this._initSubscription();
  }

  private _initSubscription(): void {
    // Смена параметров: отменяет текущую загрузку и начинает новый запрос
    this.reset$
      .pipe(
        tap(() => this.cancelLoadMore$.next()),
        switchMap(() => this.fetchSource()),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.apply(result, true));

    // Подгрузка страниц: игнорирует новые вызовы пока идёт запрос
    this.loadMore$
      .pipe(
        exhaustMap(() => this.fetchSource().pipe(takeUntil(this.cancelLoadMore$))),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.apply(result, false));

    this.reset$.next();
  }

  /** Обновить параметры запроса; сбрасывает список и пагинацию */
  public updateParams(patch: { search?: string; sortDesc?: boolean }): void {
    this._params.update((p) => ({ ...p, ...patch, pageNumber: 0 }));
    this._items.set([]);
    this._hasMore.set(true);
    this.reset$.next();
  }

  /** Алиас для обновления поискового запроса */
  public search(query: string): void {
    this.updateParams({ search: query });
  }

  /** Алиас для переключения сортировки */
  public toggleSort(): void {
    this.updateParams({ sortDesc: !this.sortDesc() });
  }

  /** Загрузить следующую страницу */
  public loadMore(): void {
    if (this._hasMore() && !this._isLoading()) {
      this._params.update((p) => ({ ...p, pageNumber: p.pageNumber + 1 }));
      this.loadMore$.next();
    }
  }

  /** Создать категорию; добавляет результат в начало списка */
  public add(form: ICategoryForm): Observable<ICategory> {
    return this.api
      .create(form)
      .pipe(tap((created) => this._items.update((list) => [created, ...list])));
  }

  /** Обновить категорию; заменяет запись в списке по id */
  public update(id: number, form: ICategoryForm): Observable<ICategory> {
    return this.api
      .update(id, form)
      .pipe(
        tap((updated) =>
          this._items.update((list) => list.map((i) => (i.id === updated.id ? updated : i))),
        ),
      );
  }

  /** Удалить категорию; убирает запись из списка */
  public delete(id: number): Observable<void> {
    return this.api
      .delete(id)
      .pipe(tap(() => this._items.update((list) => list.filter((i) => i.id !== id))));
  }

  private fetchSource(): Observable<ICategoriesListResult> {
    return defer(() => {
      this._isLoading.set(true);

      return this.api.getList(this._params()).pipe(finalize(() => this._isLoading.set(false)));
    });
  }

  private apply(result: ICategoriesListResult, reset: boolean): void {
    const hasMore = result.items.length > this.PAGE_SIZE;
    const items = hasMore ? result.items.slice(0, this.PAGE_SIZE) : result.items;

    this._hasMore.set(hasMore);
    this._canEdit.set(result.canEdit);

    if (reset) {
      this._items.set(items);
    } else {
      this._items.update((list) => [...list, ...items]);
    }
  }
}
