import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { MonoTypeOperatorFunction } from 'rxjs';

export function createDestroyer(): <T>() => MonoTypeOperatorFunction<T> {
  const destroyerRef = inject(DestroyRef);

  return <T>() => takeUntilDestroyed<T>(destroyerRef);
}
