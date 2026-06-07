import { computed, Directive, inject, input, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NgControl } from '@angular/forms';

@Directive()
export abstract class AControlValueAccessor<T> implements ControlValueAccessor {
  public abstract writeValue(value: T): void;

  protected readonly ngControl = inject(NgControl, { optional: true, self: true });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onChange: (value: T | null) => void = (_value: T | null) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onTouched: () => void = () => {};

  // eslint-disable-next-line @angular-eslint/no-input-rename
  public readonly isDisabledInput = input(false, { alias: 'isDisabled' });
  private readonly isDisabledByForm = signal(false);

  public readonly isDisabled = computed(() => this.isDisabledByForm() || this.isDisabledInput());

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  public registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabledByForm.set(isDisabled);
  }
}
