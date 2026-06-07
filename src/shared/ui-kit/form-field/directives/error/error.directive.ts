import { Directive } from '@angular/core';

let nextId = 0;

@Directive({
  selector: 'ui-kit-error, [uiKitError]',
  host: { '[id]': 'id', role: 'alert' },
})
export class ErrorDirective {
  public readonly id = `ui-kit-error-${nextId++}`;
}
