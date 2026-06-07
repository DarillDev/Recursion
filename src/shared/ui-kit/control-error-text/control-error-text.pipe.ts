import type { PipeTransform } from '@angular/core';
import { inject, Pipe } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { CONTROL_ERRORS } from './config/control-errors.token';
import { DEFAULT_ERRORS } from './constants/default-errors.const';
import type { TErrorsTextMap } from './types/errors-text-map.type';

/**
 * Transforms ValidationErrors into a human-readable error message.
 * Takes the first key from the errors object and resolves it against the errors map.
 *
 * Base errors (required, email, min/max, etc.) are defined in DEFAULT_ERRORS.
 * Use provideControlErrors() in any injector to extend or override them.
 *
 * IMPORTANT: provideControlErrors() reads the parent map via skipSelf, then merges
 * the new entries on top. This means every injector level inherits all errors from
 * above - overriding a key just replaces it in the merged result.
 *
 * @example
 * // globally in app.config.ts
 * provideControlErrors(new Map([['customRule', 'Custom error message']]))
 *
 * // locally in a component — scoped to this injector subtree only
 * providers: [provideControlErrors(new Map([['required', 'This field cannot be empty']]))]
 */
@Pipe({
  name: 'controlErrorText',
  standalone: true,
})
export class ControlErrorTextPipe implements PipeTransform {
  private readonly errorsMap: TErrorsTextMap;

  constructor() {
    const extended = inject(CONTROL_ERRORS, { optional: true });
    this.errorsMap = new Map([...DEFAULT_ERRORS, ...(extended ?? [])]);
  }

  public transform(errors: ValidationErrors | null | undefined): string {
    if (!errors) {
      return '';
    }

    const key = Object.keys(errors)[0];
    const resolver = this.errorsMap.get(key);

    if (!resolver) {
      return `Unknown error: ${key}`;
    }

    return typeof resolver === 'function' ? resolver(errors) : resolver;
  }
}
