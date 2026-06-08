import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, switchMap, take } from 'rxjs';
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
import { createDestroyer } from '@shared/utils/create-destroyer';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, SearchInputComponent, ReactiveFormsModule, CategoryTableComponent],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryListService],
})
export class CategoryListPageComponent implements OnInit {
  private readonly listService = inject(CategoryListService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy = createDestroyer();

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly items = this.listService.items;
  protected readonly isLoading = this.listService.isLoading;
  protected readonly hasMore = this.listService.hasMore;
  protected readonly sort = this.listService.sort;
  protected readonly canEdit = this.listService.canEdit;

  public ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), this.destroy())
      .subscribe((search) => this.listService.updateParams({ search }));
  }

  protected onSortToggle(field: 'id' | 'name'): void {
    this.listService.toggleSort(field);
  }

  protected onLoadMore(): void {
    this.listService.loadMore();
  }

  protected onAdd(): void {
    this.modalService
      .open<ICategoryForm, null>(CategoryFormDialogComponent, null)
      .pipe(
        filter(Boolean),
        take(1),
        switchMap((form) => this.listService.add(form)),
        this.destroy(),
      )
      .subscribe();
  }

  protected onEdit(category: ICategory): void {
    this.modalService
      .open<ICategoryForm, ICategory>(CategoryFormDialogComponent, category)
      .pipe(
        filter(Boolean),
        take(1),
        switchMap((form) => this.listService.update({ ...category, ...form })),
        this.destroy(),
      )
      .subscribe();
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm({ description: 'Are you sure you want to delete this item?', confirmButtonLabel: 'Delete' })
      .pipe(
        filter(Boolean),
        take(1),
        switchMap(() => this.listService.delete(category.id)),
        this.destroy(),
      )
      .subscribe();
  }
}
