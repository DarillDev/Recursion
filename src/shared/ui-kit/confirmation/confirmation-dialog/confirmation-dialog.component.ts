import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import type { IConfirmationDialogData } from '../interfaces/confirmation-dialog-data.interface';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';

@Component({
  selector: 'ui-kit-confirmation-dialog',
  imports: [ModalContainerComponent, ButtonComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  protected readonly data = inject<IConfirmationDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
