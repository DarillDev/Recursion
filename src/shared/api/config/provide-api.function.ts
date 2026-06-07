import type { EnvironmentProviders} from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import type { IApiConfig } from './api-config.interface';
import { API_CONFIG } from './api-config.token';

const DEFAULT_TIMEOUT_IN_MS = 30_000;

/** Регистрирует конфигурацию API в DI-контейнере Angular. */
export function provideApiConfig(config: IApiConfig): EnvironmentProviders {
  const fixedConfig: Required<IApiConfig> = {
    timeoutInMs: DEFAULT_TIMEOUT_IN_MS,
    ...config,
  };

  return makeEnvironmentProviders([{ provide: API_CONFIG, useValue: fixedConfig }]);
}
