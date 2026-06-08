import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { AppEnvironmentMapper } from '@shared/core/app-env';

/**
 * app.config-resolver содержит все провайдеры приложения и является самым тяжёлым чанком.
 * Статический импорт увеличил бы main bundle — браузер долго загружал бы его до старта.
 * Динамический import() выносит его в отдельный чанк, за счёт чего environment.json
 * и app.config-resolver загружаются параллельно, ускоряя старт приложения.
 */
void (async function bootstrapApp(): Promise<void> {
  const environmentPromise = fetch('/environment.json')
    .then((res) => res.json())
    .catch(() => {
      throw new Error('Failed to load environment.json');
    });
  const configResolverPromise = import('./app/app.config-resolver').then(
    (m) => m.appConfigResolver,
  );

  const [appEnvironmentDto, appConfigResolver] = await Promise.all([
    environmentPromise,
    configResolverPromise,
  ]);
  const appEnvironment = AppEnvironmentMapper.fromDto(appEnvironmentDto);

  await bootstrapApplication(AppComponent, appConfigResolver(appEnvironment));
})();
