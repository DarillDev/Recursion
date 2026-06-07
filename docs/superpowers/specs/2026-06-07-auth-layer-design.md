# Auth Layer Design

## Принципы

- `app/auth/` и `app/api/` — полностью независимые слои, ничего не знают друг о друге.
- `app/auth/` делает HTTP-запросы самостоятельно через `HttpClient`, используя `authUrl` из своего конфига.
- Конкретные роуты приложения (`/login`, `/categories`) не зашиты в `auth` — передаются снаружи через `IAuthConfig`.

---

## Изменения в окружении

### `public/environment.json`

```json
{
  "apiUrl": "https://zidium3-backend.zidium.net",
  "authUrl": "https://zidium3-backend.zidium.net",
  "title": "Indigo Soft"
}
```

### `core/app-environment/interfaces/app-environment.interface.ts`

```ts
interface IAppEnvironment {
  apiUrl: string;
  authUrl: string;
  title: string;
}
```

---

## Модуль `src/app/auth/`

Полностью самодостаточный слой. Никаких импортов из `app/api/` или `app/core/`.

### Структура

```
src/app/auth/
  config/
    provide-auth.function.ts
    auth-config.token.ts
  interfaces/
    auth-config.interface.ts
    token.interface.ts
    auth-user.interface.ts
    login-response.interface.ts
  models/
    token.ts
  services/
    auth-http/auth-http.service.ts
    token-storage/token-storage.service.ts
  guards/
    auth.guard.ts
  interceptors/
    auth.interceptor.ts
  index.ts
```

### Конфигурация

```ts
// interfaces/auth-config.interface.ts
interface IAuthConfig {
  authUrl: string;
  redirects: {
    onUnauthenticated: string;  // напр. '/login'
    onAuthenticated: string;    // напр. '/categories'
  };
}

// auth-config.token.ts
const AUTH_CONFIG = new InjectionToken<IAuthConfig>('AUTH_CONFIG');
```

### Интерфейсы

```ts
// interfaces/token.interface.ts
interface IToken {
  accessToken: string;
  refreshToken: string;
}

// interfaces/auth-user.interface.ts
interface IAuthUser {
  displayName: string;
  timezoneOffset: string;
}

// interfaces/login-response.interface.ts
interface ILoginResponse {
  user: IAuthUser;
  token: IToken;
}
```

### Token модель

```ts
// models/token.ts
class Token implements IToken {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
```

### AuthHttpService

`providedIn: 'root'`. Делает HTTP-запросы напрямую через `inject(HttpClient)`. URL берёт из `inject(AUTH_CONFIG).authUrl`. Никаких зависимостей от `app/api/`.

Эндпоинты (по Swagger `POST /front/logon`, `POST /front/logon/refresh-token`):

```ts
// Запрос логина: { login: string, password: string }
// Ответ: { user: { displayName, timezoneOffset }, token: string, refreshToken: string }
login(login: string, password: string): Observable<ILoginResponse>

// Запрос refresh: { refreshToken: string }
// Ответ: аналогичен login
refreshToken(refreshToken: string): Observable<ILoginResponse>
```

Маппинг в сервисе: серверный `token` (string) → `IToken.accessToken`.

### TokenStorageService

`providedIn: 'root'`. Работает с `localStorage`.

```ts
getToken(): IToken | null
setToken(token: IToken): void
clearToken(): void
```

Ключи: `auth_access_token`, `auth_refresh_token`.

### JWT-утилита

Файл `utils/jwt.utils.ts`. Чистая функция без зависимостей:

```ts
decodeJwtExp(token: string): number | null
```

Декодирует base64url-payload JWT, возвращает значение поля `exp` (Unix timestamp в секундах) или `null` если токен нераспознаваемый или поле отсутствует.

### AuthInitService

`providedIn: 'root'`. Метод `initialize(): Observable<null>`:

1. Нет токена в `TokenStorageService` → `of(null)` немедленно
2. Есть токен → декодировать `exp` из `accessToken`
3. `exp === null` или `now >= exp` → токен просрочен → вызвать `AuthHttpService.refreshToken()`
   - Успех: сохранить новый токен, вернуть `of(null)`
   - Ошибка: очистить токен через `clearToken()`, вернуть `of(null)` (не пробрасывать ошибку — guard перенаправит)
4. Токен не просрочен → `of(null)` немедленно

Регистрируется в `provideAuth()` через `APP_INITIALIZER` (factory возвращает `() => firstValueFrom(authInit.initialize())`). Angular ждёт завершения всех `APP_INITIALIZER` перед рендером первого маршрута.

### authGuard

Функциональный `CanActivateFn`. Инжектит `TokenStorageService` и `AUTH_CONFIG`.

- Есть токен → `true`
- Нет токена → `router.createUrlTree([config.redirects.onUnauthenticated])`

### publicGuard

Для страниц только для неавторизованных (напр. `/login`).

- Нет токена → `true`
- Есть токен → `router.createUrlTree([config.redirects.onAuthenticated])`

### authInterceptor

Функциональный `HttpInterceptorFn`.

**Исключения** — запросы на `authUrl` (login и refresh) пропускаются без заголовка и без обработки 401.

**Нормальный путь:**
1. Взять `accessToken` из `TokenStorageService`
2. Клонировать запрос с `Authorization: Bearer <accessToken>`

**Путь 401:**
1. Если `isRefreshing === true` → добавить запрос в `refreshQueue`
2. Иначе:
   - `isRefreshing = true`
   - Вызвать `AuthHttpService.refreshToken(currentRefreshToken)`
   - **Успех**: сохранить новый токен, сбросить флаг, повторить все запросы из очереди + текущий
   - **Ошибка**: `clearToken()`, сбросить флаг и очередь, `Router.navigate([config.redirects.onUnauthenticated])`, пробросить ошибку

`isRefreshing` и `refreshQueue` — модульные переменные внутри файла interceptor.

### provideAuth()

```ts
function provideAuth(config: IAuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
  ]);
}
```

Interceptor регистрируется в `app.config-resolver.ts` через `withInterceptors([authInterceptor])`.

### Barrel

```ts
// index.ts
export { provideAuth } from './config/provide-auth.function';
export { authGuard } from './guards/auth.guard';
export { publicGuard } from './guards/public.guard';
export { authInterceptor } from './interceptors/auth.interceptor';
export type { IAuthConfig } from './interfaces/auth-config.interface';
export type { IToken } from './interfaces/token.interface';
export type { ILoginResponse } from './interfaces/login-response.interface';
export { TokenStorageService } from './services/token-storage/token-storage.service';
```

Path alias: `@auth` → `src/app/auth/`

---

## Интеграция в app.config-resolver.ts

```ts
import { authInterceptor, provideAuth } from '@auth';
import { AppEnvironment } from '@core/app-env';

export const appConfigResolver = (env: AppEnvironment): ApplicationConfig => ({
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuth({
      authUrl: env.authUrl,
      redirects: {
        onUnauthenticated: '/login',
        onAuthenticated: '/categories',
      },
    }),
    // ...остальные провайдеры
  ],
});
```

---

## tsconfig

В `tsconfig.app.json` и `tsconfig.spec.json`:

```json
"@auth": ["src/app/auth/"]
```

---

## Тестирование

- `TokenStorageService`: юнит-тесты с mock `localStorage`
- `authGuard`: с токеном → `true`; без токена → redirect на `onUnauthenticated`
- `publicGuard`: без токена → `true`; с токеном → redirect на `onAuthenticated`
- `authInterceptor`: добавление заголовка; 401 → refresh → retry; 401 + неудачный refresh → redirect; очередь параллельных 401
- `AuthHttpService`: маппинг серверного `token` → `accessToken`
