import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, switchMap, take } from 'rxjs';
import type { ICategory } from '@shared/api/categories';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import { ButtonComponent } from '@shared/ui-kit/button';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CategoryTableComponent } from '../../components/category-table';
import { createDestroyer } from '@shared/utils/create-destroyer';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { CategoryListService } from '../../services/category-list/category-list.service';

@Component({
  selector: 'app-category-list-page',
  imports: [
    ButtonComponent,
    SearchInputComponent,
    ReactiveFormsModule,
    CategoryTableComponent,
    RouterOutlet,
  ],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryListService],
})
export class CategoryListPageComponent implements OnInit {
  private readonly listService = inject(CategoryListService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  private readonly destroy = createDestroyer();

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly items = this.listService.items;
  protected readonly isLoading = this.listService.isLoading;
  protected readonly hasMore = this.listService.hasMore;
  protected readonly sort = this.listService.sort;
  protected readonly canAdd = this.listService.canAdd;

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
      .open<boolean, null>(CategoryFormDialogComponent, null, this.injector)
      .pipe(filter(Boolean), take(1), this.destroy())
      .subscribe(() => this.listService.updateParams({}));
  }

  protected onEdit(category: ICategory): void {
    void this.router.navigate([category.id], { relativeTo: this.route });
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm({
        description: 'Are you sure you want to delete this item?',
        confirmButtonLabel: 'Delete',
      })
      .pipe(
        filter(Boolean),
        take(1),
        switchMap(() => this.listService.delete(category.id)),
        this.destroy(),
      )
      .subscribe();
  }
}
