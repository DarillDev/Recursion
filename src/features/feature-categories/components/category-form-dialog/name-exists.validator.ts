import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import type { Observable } from 'rxjs';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { CategoriesService } from '@shared/api/categories';

export function nameExistsValidator(
  service: CategoriesService,
  currentId: string | null,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value?.trim()) return of(null);
    return timer(400).pipe(
      switchMap(() =>
        service.checkNameExists({ name: control.value.trim(), id: currentId }),
      ),
      map((exists) => (exists ? { nameExists: true } : null)),
    );
  };
}
