import type { ValidationErrors } from '@angular/forms';
import type { TErrorsTextMap } from '../types/errors-text-map.type';

export const DEFAULT_ERRORS: TErrorsTextMap = new Map<
  string,
  string | ((error: ValidationErrors) => string)
>([
  ['required', 'This field is required'],
  ['email', 'Invalid email address'],
  ['minlength', (error) => `Minimum ${error['minlength'].requiredLength} characters`],
  ['maxlength', (error) => `Maximum ${error['maxlength'].requiredLength} characters`],
  ['min', (error) => `Minimum value: ${error['min'].min}`],
  ['max', (error) => `Maximum value: ${error['max'].max}`],
]);
