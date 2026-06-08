import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CategoriesApiService, type ICategory } from '@shared/api/categories';
import type { ICategoryForm } from '../../interfaces/category-form.interface';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';
import { provideControlErrors } from '@shared/ui-kit/control-error-text';
import { nameExistsValidator } from './validators/name-exist/name-exists.validator';
import { ERROR_TEXT_MAP } from './constants/errors-text-map.const';

@Component({
  selector: 'app-category-form-dialog',
  imports: [ReactiveFormsModule, ModalContainerComponent, ButtonComponent, InputFieldComponent],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideControlErrors(ERROR_TEXT_MAP)],
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject<DialogRef<ICategoryForm>>(DialogRef);
  private readonly categoriesService = inject(CategoriesApiService);

  protected readonly data = inject<ICategory | null | undefined>(DIALOG_DATA, { optional: true });
  protected readonly isEditMode = this.data !== null && this.data !== undefined;
  protected readonly title = this.isEditMode ? 'Edit' : 'Add';

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data?.name ?? '',
      [Validators.required],
      [nameExistsValidator(this.categoriesService, this.data?.id ?? null)],
    ],
    description: [this.data?.description ?? ''],
  });


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
