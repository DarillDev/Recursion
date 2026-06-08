import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, filter, skip, switchMap } from 'rxjs';
import type { ICategory } from '@shared/api/categories';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import type { ICategoryForm } from '../../interfaces/category-form.interface';
import { ButtonComponent } from '@shared/ui-kit/button';
import { IconComponent } from '@shared/ui-kit/icon';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CategoryListService } from './services/category-list/category-list.service';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, IconComponent, SearchInputComponent, ReactiveFormsModule],
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

  protected onSearchChange(search: string): void {
    this.listService.updateParams({ search });
  }

  protected onSortToggle(): void {
    this.listService.updateParams({ sortDesc: !this.sortDesc() });
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom) {
      this.listService.loadMore();
    }
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
