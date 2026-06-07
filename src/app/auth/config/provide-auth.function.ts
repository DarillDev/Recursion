import type { EnvironmentProviders} from '@angular/core';
import { APP_INITIALIZER, inject, makeEnvironmentProviders } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from './auth-config.token';
import { AuthInitService } from '../services/auth-init/auth-init.service';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authInit = inject(AuthInitService);
        return (): Promise<null> => firstValueFrom(authInit.initialize());
      },
      multi: true,
    },
  ]);
