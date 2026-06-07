import { HttpParams } from '@angular/common/http';

/** Сериализует объект в HttpParams, пропуская null и undefined. */
export function buildParams<T extends object>(params: T): HttpParams {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) {
      return acc;
    }

    if (Array.isArray(value)) {
      return value.reduce((p: HttpParams, v: unknown) => p.append(key, String(v)), acc);
    }

    return acc.set(key, String(value));
  }, new HttpParams());
}
