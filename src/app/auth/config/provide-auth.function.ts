import type { EnvironmentProviders } from '@angular/core';
import { inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AUTH_CONFIG } from './auth-config.token';
import { AuthStateService } from '../services/auth-state/auth-state.service';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
    provideAppInitializer(() => {
      const authState = inject(AuthStateService);
      const token = authState.token();

      if (!token?.isExpired) {
        return;
      }

      return firstValueFrom(
        authState.refreshToken().pipe(
          catchError(() => {
            authState.logout();
            return of(null);
          }),
        ),
      );
    }),
  ]);
