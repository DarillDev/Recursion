import type { OnInit, TrackByFunction } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  CdkVirtualScrollViewport,
  CdkVirtualForOf,
  CdkFixedSizeVirtualScroll,
} from '@angular/cdk/scrolling';
import { IconComponent } from '@shared/ui-kit/icon';
import type { ICategory } from '@shared/api/categories';
import { throttleTime } from 'rxjs';
import type { ISort } from '../../models/interfaces/sort.interface';
import { createDestroyer } from '@shared/utils/create-destroyer';

@Component({
  selector: 'app-category-table',
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, IconComponent],
  templateUrl: './category-table.component.html',
  styleUrl: './category-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTableComponent implements OnInit {
  private readonly destroy = createDestroyer();

  protected readonly trackById: TrackByFunction<ICategory> = (_, { id }) => id;

  public readonly items = input.required<ICategory[]>();
  public readonly isLoading = input.required<boolean>();
  public readonly sort = input.required<ISort | undefined>();
  public readonly canEdit = input.required<boolean>();
  public readonly hasMore = input.required<boolean>();
  public readonly itemSize = input(50);
  public readonly itemsThreshold = input(5);

  public readonly sortToggle = output<'id' | 'name'>();
  public readonly edit = output<ICategory>();
  public readonly delete = output<ICategory>();
  public readonly loadMore = output<void>();

  private readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  protected onRowActivate(item: ICategory): void {
    if (this.canEdit()) {
      this.edit.emit(item);
    }
  }

  public ngOnInit(): void {
    const viewport = this.viewport();

    const scrollEvent = viewport.scrolledIndexChange.pipe(throttleTime(50));

    scrollEvent.pipe(this.destroy()).subscribe((firstVisible) => {
      if (!this.hasMore() || this.isLoading()) {
        return;
      }

      const itemLength = this.items().length;
      const viewportHeight = viewport.getViewportSize();
      const lastIndex = Math.round(viewportHeight / this.itemSize()) + firstVisible;
      const breakpointIndex = itemLength - this.itemsThreshold();

      if (lastIndex >= breakpointIndex) {
        this.loadMore.emit();
      }
    });
  }
}
