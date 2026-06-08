import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import type { CategoriesApiService } from '@shared/api/categories';
import type { Observable } from 'rxjs';
import { of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs';

export function nameExistsValidator(
  service: CategoriesApiService,
  currentId: number | null,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value?.trim()) {
      return of(null);
    }

    return timer(200).pipe(
      switchMap(() => service.checkNameExists({ name: control.value.trim(), id: currentId })),
      map((exists) => (exists ? { nameExists: true } : null)),
      // Null - потому что мы не знаем ошибка это или нет. Будем считать что это валидно.
      catchError(() => of(null)),
    );
  };
}
