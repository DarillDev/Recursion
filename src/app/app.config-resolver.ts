import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import type { AppEnvironment } from 'src/shared/core/app-environment';
import { provideAppEnvironment } from 'src/shared/core/app-environment';
import type { IApiConfig } from 'src/shared/api/config';
import { provideApiConfig } from 'src/shared/api/config';
import type { IAuthConfig } from 'src/shared/auth';
import { authInterceptor, provideAuth } from 'src/shared/auth';

export const appConfigResolver = (appEnvironment: AppEnvironment): ApplicationConfig => {
  const apiConfig: IApiConfig = { baseUrl: appEnvironment.apiUrl };
  const authConfig: IAuthConfig = {
    authUrl: appEnvironment.authUrl,
    redirects: {
      onUnauthenticated: '/login',
      onAuthenticated: '/categories',
    },
  };

  return {
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideApiConfig(apiConfig),
      provideAppEnvironment(appEnvironment),
      provideAuth(authConfig),
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
    ],
  };
};
