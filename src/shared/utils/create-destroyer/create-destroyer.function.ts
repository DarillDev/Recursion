import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { MonoTypeOperatorFunction } from 'rxjs';

export function createDestroyer<K>(): () => MonoTypeOperatorFunction<K> {
  const destroyerRef = inject(DestroyRef);

  return () => takeUntilDestroyed(destroyerRef);
}
