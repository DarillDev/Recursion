import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppEnvironment, provideAppEnvironment } from '@core/app-env';
import { IApiConfig, provideApiConfig } from '@api/config';

export const appConfigResolver = (appEnvironment: AppEnvironment): ApplicationConfig => {
  const apiConfig: IApiConfig = { baseUrl: appEnvironment.apiUrl };

  return {
    providers: [
      provideHttpClient(),
      provideApiConfig(apiConfig),
      provideAppEnvironment(appEnvironment),
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
    ],
  };
};
