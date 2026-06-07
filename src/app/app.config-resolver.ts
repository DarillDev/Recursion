import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppEnvironment, provideAppEnvironment } from '@core/app-env';

export const appConfigResolver = (appEnvironment: AppEnvironment): ApplicationConfig => {
  return {
    providers: [
      provideAppEnvironment(appEnvironment),
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
    ],
  };
};
