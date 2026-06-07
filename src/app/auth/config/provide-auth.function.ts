import type { EnvironmentProviders } from '@angular/core';
import { inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from './auth-config.token';
import { AuthInitService } from '../services/auth-init/auth-init.service';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

const authInitializer = provideAppInitializer(() => {
  const authInit = inject(AuthInitService);

  return firstValueFrom(authInit.initialize());
});

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: AUTH_CONFIG, useValue: config }, authInitializer]);
