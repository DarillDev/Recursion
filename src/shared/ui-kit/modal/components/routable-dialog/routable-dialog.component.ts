import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import type { OnInit, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { ModalService } from '../../modal.service';

@Component({
  selector: 'ui-kit-routable-dialog',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutableDialogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly injector = inject(Injector);

  public ngOnInit(): void {
    const dialogComponent = this.route.snapshot.data['dialog'] as Type<unknown>;
    const dialogData = (this.route.snapshot.data['dialogData'] as unknown) ?? null;

    this.modalService
      .open(dialogComponent, dialogData, this.injector)
      .pipe(take(1))
      .subscribe({ complete: () => void this.router.navigate(['..'], { relativeTo: this.route }) });
  }
}
