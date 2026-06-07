import type { FactoryProvider} from '@angular/core';
import { inject } from '@angular/core';
import { CONTROL_ERRORS } from './control-errors.token';
import type { TErrorsTextMap } from '../types/errors-text-map.type';

export function provideControlErrors(map: TErrorsTextMap): FactoryProvider {
  return {
    provide: CONTROL_ERRORS,
    useFactory: () => {
      const parent = inject(CONTROL_ERRORS, { skipSelf: true, optional: true });

      return new Map([...(parent ?? []), ...map]);
    },
  };
}
