import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { AInputBaseControl } from '../input-base/input-base.abstract';
import { FormFieldComponent, PrefixDirective } from '@shared/ui-kit/form-field';
import { InputDirective } from '../../directives/input.directive';
import { IconComponent } from '@shared/ui-kit/icon';

let searchInputNextId = 0;

@Component({
  selector: 'ui-kit-search-input',
  imports: [FormFieldComponent, PrefixDirective, InputDirective, IconComponent],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent extends AInputBaseControl<string> {
  protected readonly value = signal('');

  public readonly id = input(`ds-search-input-${searchInputNextId++}`);
  public readonly hasIcon = input(false);

  public writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  public onValueChange(event: Event): void {
    this.onChange?.((event.target as HTMLInputElement).value);
    this.onTouched();
  }
}
