import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import type { ICategory } from '@shared/api/categories';
import { CategoriesService } from '@shared/api/categories';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';
import { provideControlErrors } from '@shared/ui-kit/control-error-text';
import { nameExistsValidator } from './name-exists.validator';

@Component({
  selector: 'app-category-form-dialog',
  imports: [ReactiveFormsModule, ModalContainerComponent, ButtonComponent, InputFieldComponent],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideControlErrors(new Map([['nameExists', 'Это название уже занято']])),
  ],
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject<DialogRef<ICategoryForm>>(DialogRef);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly data = inject<ICategory | null>(DIALOG_DATA, { optional: true });
  protected readonly isEditMode = this.data !== null;
  protected readonly title = this.isEditMode ? 'Редактировать категорию' : 'Добавить категорию';

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data?.name ?? '',
      [Validators.required],
      [nameExistsValidator(this.categoriesService, this.data?.id ?? null)],
    ],
  });

  constructor() {
    if (this.isEditMode && !this.data?.canEdit) {
      this.form.controls.name.disable();
    }
  }

  protected onSubmit(): void {
    if (this.form.status !== 'VALID') {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
