import type { EnvironmentProviders } from '@angular/core';
import { inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from './auth-config.token';
import { AuthStateService } from '../services/auth-state/auth-state.service';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
    provideAppInitializer(() => {
      const authState = inject(AuthStateService);
      return firstValueFrom(authState.initialize());
    }),
  ]);
