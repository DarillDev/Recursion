import { Directive, input } from '@angular/core';
import type { TNillable } from 'src/shared/models';
import { AControlValueAccessor } from 'src/shared/models';

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
}
