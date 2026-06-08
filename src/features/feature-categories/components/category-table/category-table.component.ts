import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkVirtualScrollViewport, CdkVirtualForOf, CdkFixedSizeVirtualScroll } from '@angular/cdk/scrolling';
import { IconComponent } from '@shared/ui-kit/icon';
import type { ICategory } from '@shared/api/categories';

const LOAD_MORE_THRESHOLD = 5;

@Component({
  selector: 'app-category-table',
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, IconComponent],
  templateUrl: './category-table.component.html',
  styleUrl: './category-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTableComponent {
  public readonly items = input.required<ICategory[]>();
  public readonly isLoading = input.required<boolean>();
  public readonly sortDesc = input.required<boolean>();
  public readonly canEdit = input.required<boolean>();
  public readonly hasMore = input.required<boolean>();

  public readonly sortToggle = output<void>();
  public readonly edit = output<ICategory>();
  public readonly delete = output<ICategory>();
  public readonly loadMore = output<void>();

  protected onScrolledIndex(firstVisible: number): void {
    if (this.hasMore() && !this.isLoading()) {
      if (firstVisible >= this.items().length - LOAD_MORE_THRESHOLD) {
        this.loadMore.emit();
      }
    }
  }
}
