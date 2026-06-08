import { Directive, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { AControlValueAccessor } from '@shared/models';
import type { TNillable } from '@shared/models';

@Directive()
export abstract class AInputBaseControl<T> extends AControlValueAccessor<T> {
  public readonly label = input<string>();
  public readonly placeholder = input('');
  public readonly type = input<'text' | 'email' | 'password' | 'number'>('text');
  public readonly hint = input('');
  public readonly error = input<TNillable<string>>(null);

  public onBlur(): void {
    this.onTouched();
  }

  public get touched(): boolean {
    return Boolean(this.ngControl?.control?.touched);
  }

  public get controlErrors(): ValidationErrors | null | undefined {
    return this.ngControl?.control?.errors;
  }
}
