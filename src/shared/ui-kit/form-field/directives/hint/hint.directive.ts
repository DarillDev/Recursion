import { Directive } from '@angular/core';

let nextId = 0;

@Directive({
  selector: 'ui-kit-hint, [uiKitHint]',
  host: {
    '[id]': 'id',
    class: 'ui-kit-form-field_hint',
    '[class.ui-kit-form-field_hint--end]': 'align === "end"',
  },
})
export class HintDirective {
  public readonly id = `ui-kit-hint-${nextId++}`;

  public readonly align: 'start' | 'end' = 'start';
}
