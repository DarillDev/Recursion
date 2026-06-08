import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CategoriesApiService, type ICategory } from '@shared/api/categories';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';
import { provideControlErrors } from '@shared/ui-kit/control-error-text';
import { nameExistsValidator } from './validators/name-exist/name-exists.validator';
import { ERROR_TEXT_MAP } from './constants/errors-text-map.const';
import { CategoryListService } from '../../services/category-list/category-list.service';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly categoriesService = inject(CategoriesApiService);
  private readonly categoryListService = inject(CategoryListService);

  protected readonly data = inject<ICategory | null | undefined>(DIALOG_DATA, { optional: true });
  protected readonly isEditMode = this.data !== null && this.data !== undefined;
  protected readonly title = this.isEditMode ? 'Edit' : 'Add';

  protected readonly idControl = new FormControl({ value: this.data?.id ?? null, disabled: true });

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data?.name ?? '',
      [Validators.required],
      [nameExistsValidator(this.categoriesService, this.data?.id ?? null)],
    ],
  });

  private readonly _isSubmitting = signal(false);
  protected readonly isSubmitting = this._isSubmitting.asReadonly();

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly isSaveDisabled = computed(() => {
    if (this.isSubmitting()) {
      return true;
    }

    const status = this.formStatus();

    if (status === 'INVALID' || status === 'PENDING') {
      return true;
    }

    if (!this.isEditMode) {
      return false;
    }

    const { name } = this.formValue();
    return name.trim() === (this.data?.name ?? '');
  });

  protected onSubmit(): void {
    if (this.form.status !== 'VALID') {
      this.form.markAllAsTouched();

      return;
    }

    this._isSubmitting.set(true);
    const { name } = this.form.getRawValue();

    const request$ =
      this.isEditMode && this.data
        ? this.categoryListService.update({ ...this.data, name })
        : this.categoryListService.add({ name });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this._isSubmitting.set(false),
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
