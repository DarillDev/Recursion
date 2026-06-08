import type { OnInit, TrackByFunction } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { TSort } from '../../models/types/sort.type';

@Component({
  selector: 'app-category-table',
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, IconComponent],
  templateUrl: './category-table.component.html',
  styleUrl: './category-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTableComponent implements OnInit {
  private readonly destroyerRef = inject(DestroyRef);

  protected readonly trackById: TrackByFunction<ICategory> = (_, { id }) => id;

  public readonly items = input.required<ICategory[]>();
  public readonly isLoading = input.required<boolean>();
  public readonly sort = input.required<TSort | undefined>();
  public readonly canEdit = input.required<boolean>();
  public readonly hasMore = input.required<boolean>();
  public readonly itemSize = input(50);
  public readonly itemsThreshold = input(5);

  public readonly sortToggle = output<'id' | 'name'>();
  public readonly edit = output<ICategory>();
  public readonly delete = output<ICategory>();
  public readonly loadMore = output<void>();

  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  public ngOnInit(): void {
    const viewport = this.viewport();

    if (!viewport) {
      return;
    }

    const scrollEvent = viewport.scrolledIndexChange.pipe(throttleTime(50));

    scrollEvent.pipe(takeUntilDestroyed(this.destroyerRef)).subscribe((firstVisible) => {
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
