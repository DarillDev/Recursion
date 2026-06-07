import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { ControlErrorTextPipe } from '@shared/ui-kit/control-error-text';
import { AInputBaseControl } from '../input-base/input-base.abstract';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@shared/ui-kit/form-field';
import { InputDirective } from '../../directives/input.directive';

let uiKitInputFieldNextId = 0;

@Component({
  selector: 'ui-kit-input-field',
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormFieldComponent,
    InputDirective,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    ControlErrorTextPipe,
  ],
})
export class InputFieldComponent extends AInputBaseControl<string> {
  protected readonly value = signal('');

  public readonly id = input(`ui-kit-input-field-${uiKitInputFieldNextId++}`);

  public writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  public onValueChange(event: Event): void {
    this.onChange?.((event.target as HTMLInputElement).value);
    this.onTouched();
  }
}
