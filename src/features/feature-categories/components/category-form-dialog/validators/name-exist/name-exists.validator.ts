import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import type { CategoriesApiService } from '@shared/api/categories';
import type { Observable } from 'rxjs';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export function nameExistsValidator(
  service: CategoriesApiService,
  currentId: number | null,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value?.trim()) return of(null);
    return timer(400).pipe(
      switchMap(() => service.checkNameExists({ name: control.value.trim(), id: currentId })),
      map((exists) => (exists ? { nameExists: true } : null)),
    );
  };
}
