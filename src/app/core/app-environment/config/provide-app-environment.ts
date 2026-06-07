import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { AppEnvironment } from '../models/app-environment';

/**
 * Регистрирует конфигурацию окружения в Angular DI на уровне всего приложения.
 *
 * После регистрации `AppEnvironment` доступен через `inject(AppEnvironment)` в любом месте приложения.
 */
export const provideAppEnvironment = (env: AppEnvironment): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: AppEnvironment, useValue: env }]);
