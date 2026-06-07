import type { ValidationErrors } from '@angular/forms';

export type TErrorsTextMap = Map<string, string | ((errors: ValidationErrors) => string)>;
