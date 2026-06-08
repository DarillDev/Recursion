import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, filter, switchMap } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CategoriesService } from '@shared/api/categories';
import type { ICategory } from '@shared/api/categories';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';
import { ButtonComponent } from '@shared/ui-kit/button';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, SearchInputComponent, FormsModule],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListPageComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<ICategory[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly sortDesc = signal(false);
  protected readonly searchValue = signal('');

  protected readonly canAdd = computed(() => {
    const list = this.items();
    return list.length === 0 || list.some((i) => i.canEdit);
  });

  private readonly searchSubject = new Subject<string>();
  private pageNumber = 0;
  private readonly PAGE_SIZE = 20;

  public ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchValue.set(query);
        this.loadPage(true);
      });

    this.loadPage(true);
  }

  protected onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  protected onSortToggle(): void {
    this.sortDesc.update((v) => !v);
    this.loadPage(true);
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom && this.hasMore() && !this.isLoading()) {
      this.loadPage(false);
    }
  }

  protected onAdd(): void {
    this.modalService
      .open<ICategoryForm>(CategoryFormDialogComponent)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.categoriesService.create(form)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((created) => {
        this.items.update((list) => [created, ...list]);
      });
  }

  protected onEdit(category: ICategory): void {
    this.modalService
      .open<ICategoryForm, ICategory>(CategoryFormDialogComponent, category)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.categoriesService.update(category.id, form)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      });
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm('Удалить категорию', `Удалить "${category.name}"? Это действие необратимо.`)
      .pipe(
        filter(Boolean),
        switchMap(() => this.categoriesService.delete(category.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.items.update((list) => list.filter((i) => i.id !== category.id));
      });
  }

  private loadPage(reset: boolean): void {
    if (reset) {
      this.pageNumber = 0;
      this.items.set([]);
      this.hasMore.set(true);
    }

    this.isLoading.set(true);

    this.categoriesService
      .getList({
        pageNumber: this.pageNumber,
        pageSize: this.PAGE_SIZE + 1,
        search: this.searchValue(),
        sortDesc: this.sortDesc(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const hasMore = result.length > this.PAGE_SIZE;
        const page = hasMore ? result.slice(0, this.PAGE_SIZE) : result;
        this.hasMore.set(hasMore);
        this.items.update((list) => [...list, ...page]);
        this.pageNumber++;
        this.isLoading.set(false);
      });
  }
}
