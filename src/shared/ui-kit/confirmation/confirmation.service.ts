import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import type { IConfirmationDialogData } from './interfaces/confirmation-dialog-data.interface';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly modalService = inject(ModalService);

  private readonly defaultTitle = 'Confirmation';
  private readonly defaultDescription = 'Confirm this action.';
  private readonly defaultConfirmButtonLabel = 'Confirm';
  private readonly defaultCancelButtonLabel = 'Cancel';

  public confirm(options?: Partial<IConfirmationDialogData>): Observable<boolean> {
    const data: IConfirmationDialogData = {
      title: options?.title ?? this.defaultTitle,
      description: options?.description ?? this.defaultDescription,
      confirmButtonLabel: options?.confirmButtonLabel ?? this.defaultConfirmButtonLabel,
      cancelButtonLabel: options?.cancelButtonLabel ?? this.defaultCancelButtonLabel,
    };

    return this.modalService
      .open<boolean, IConfirmationDialogData>(ConfirmationDialogComponent, data)
      .pipe(map((result) => result ?? false));
  }
}
