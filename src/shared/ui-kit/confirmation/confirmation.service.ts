import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import type { IConfirmationDialogData } from './interfaces/confirmation-dialog-data.interface';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly modalService = inject(ModalService);

  public confirm(title: string, description: string): Observable<boolean> {
    return this.modalService
      .open<boolean, IConfirmationDialogData>(ConfirmationDialogComponent, { title, description })
      .pipe(map((result) => result ?? false));
  }
}
