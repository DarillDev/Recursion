import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import type { AppEnvironment } from '@core/app-env';
import { provideAppEnvironment } from '@core/app-env';
import type { IApiConfig } from '@api/config';
import { provideApiConfig } from '@api/config';
import { authInterceptor, IAuthConfig, provideAuth } from '@auth';

export const appConfigResolver = (appEnvironment: AppEnvironment): ApplicationConfig => {
  const apiConfig: IApiConfig = { baseUrl: appEnvironment.apiUrl };
  const authConfig: IAuthConfig = {
    authUrl: appEnvironment.apiUrl,
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
