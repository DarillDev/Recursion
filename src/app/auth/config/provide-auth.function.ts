import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_CONFIG } from './auth-config.token';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: AUTH_CONFIG, useValue: config }]);
