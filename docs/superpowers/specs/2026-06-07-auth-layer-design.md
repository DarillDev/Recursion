# Auth Layer Design

## Обзор

Слой авторизации состоит из двух модулей:

- **`api/controllers/auth/`** — HTTP-сервисы (login, refresh-token)
- **`src/app/auth/`** — инфраструктура: хранение токена, interceptor, guard, конфиг

Слой `auth` не знает ничего про конкретные роуты приложения — всё задаётся через `IAuthConfig` при регистрации.

---

## Модуль `api/controllers/auth/`

### Структура

```
api/controllers/auth/
  dtos/
    login-request-dto.interface.ts
    login-response-dto.interface.ts
    refresh-token-request-dto.interface.ts
    refresh-token-response-dto.interface.ts
  interfaces/
    token.interface.ts
  services/
    auth-api/auth-api.service.ts
    auth/auth.service.ts
  index.ts
  README.md
```

### DTOs

```ts
// login-request-dto.interface.ts
interface ILoginRequestDto {
  login: string;
  password: string;
}

// login-response-dto.interface.ts
interface ILoginResponseDto {
  token: string;
  refreshToken: string;
}

// refresh-token-request-dto.interface.ts
interface IRefreshTokenRequestDto {
  refreshToken: string;
}

// refresh-token-response-dto.interface.ts — совпадает с ILoginResponseDto
interface IRefreshTokenResponseDto {
  token: string;
  refreshToken: string;
}
```

### Доменная модель

```ts
// interfaces/token.interface.ts
interface IToken {
  accessToken: string;
  refreshToken: string;
}
```

### Сервисы

**`AuthApiService`** — сырые HTTP-вызовы через `ApiService`:

```ts
login(login: string, password: string): Observable<ILoginResponseDto>
refreshToken(refreshToken: string): Observable<IRefreshTokenResponseDto>
```

**`AuthService`** — публичный API с маппингом DTO → `IToken`:

```ts
login(login: string, password: string): Observable<IToken>
refreshToken(refreshToken: string): Observable<IToken>
```

### Barrel

```ts
// index.ts
export type { IToken } from './interfaces/token.interface';
export { AuthService } from './services/auth/auth.service';
```

Path alias: `@api/auth` → `src/app/api/controllers/auth/index.ts`

---

## Модуль `src/app/auth/`

### Структура

```
src/app/auth/
  config/
    provide-auth.function.ts
    auth-config.token.ts
  interfaces/
    auth-config.interface.ts
    token.interface.ts
  models/
    token.ts
  services/
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
  redirects: {
    onUnauthenticated: string;  // роут для неавторизованных (напр. '/login')
    onAuthenticated: string;    // роут для уже авторизованных (напр. '/categories')
  };
}

// auth-config.token.ts
const AUTH_CONFIG = new InjectionToken<IAuthConfig>('AUTH_CONFIG');
```

### Token модель

```ts
// interfaces/token.interface.ts
interface IToken {
  accessToken: string;
  refreshToken: string;
}

// models/token.ts
class Token implements IToken {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
```

### TokenStorageService

`providedIn: 'root'`. Работает с `localStorage`.

```ts
getToken(): IToken | null
setToken(token: IToken): void
clearToken(): void
```

Ключи: `auth_access_token`, `auth_refresh_token`.

### authGuard

Функциональный `CanActivateFn`. Инжектит `TokenStorageService` и `AUTH_CONFIG`.

- Есть токен → `true`
- Нет токена → `router.createUrlTree([config.redirects.onUnauthenticated])`

### publicGuard (опционально)

Для страниц, доступных только неавторизованным (напр. `/login`).

- Нет токена → `true`
- Есть токен → `router.createUrlTree([config.redirects.onAuthenticated])`

### authInterceptor

Функциональный `HttpInterceptorFn`.

**Нормальный путь:**

1. Взять `accessToken` из `TokenStorageService`
2. Если токен есть — клонировать запрос с заголовком `Authorization: Bearer <accessToken>`
3. Запросы на `/logon` и `/logon/refresh-token` — пропустить без заголовка и без обработки 401

**Путь 401:**

1. Interceptor перехватывает `HttpErrorResponse` со статусом 401
2. Если `isRefreshing === true` — добавить текущий запрос в `refreshQueue` (массив resolve-функций Promise)
3. Иначе:
   - Установить `isRefreshing = true`
   - Вызвать `AuthApiService.refreshToken(currentRefreshToken)`
   - **Успех**: сохранить новый токен через `TokenStorageService`, сбросить `isRefreshing`, выполнить все запросы из очереди, повторить текущий запрос
   - **Ошибка**: очистить токен, сбросить `isRefreshing`, сбросить очередь, редирект на `config.redirects.onUnauthenticated`, пробросить ошибку

`isRefreshing` и `refreshQueue` — модульные переменные внутри файла interceptor (не сервис, т.к. interceptor один на весь DI).

### provideAuth()

```ts
function provideAuth(config: IAuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
  ]);
}
```

Interceptor регистрируется через `provideHttpClient(withInterceptors([authInterceptor]))` в `app.config-resolver.ts`. `provideAuth()` не трогает `HttpClient` — он уже зарегистрирован.

**Использование в `app.config-resolver.ts`:**

```ts
provideHttpClient(withInterceptors([authInterceptor])),
provideAuth({
  redirects: {
    onUnauthenticated: '/login',
    onAuthenticated: '/categories',
  },
}),
```

### Barrel

```ts
// index.ts
export { provideAuth } from './config/provide-auth.function';
export { authGuard } from './guards/auth.guard';
export { authInterceptor } from './interceptors/auth.interceptor';
export type { IAuthConfig } from './interfaces/auth-config.interface';
export type { IToken } from './interfaces/token.interface';
```

Path alias: `@auth` → `src/app/auth/`

---

## Интеграция

### tsconfig

В обоих `tsconfig.app.json` и `tsconfig.spec.json` добавить:

```json
"@auth": ["src/app/auth/"],
"@api/auth": ["src/app/api/controllers/auth/index.ts"]
```

### app.config-resolver.ts

```ts
import { authInterceptor } from '@auth';
import { provideAuth } from '@auth';

provideHttpClient(withInterceptors([authInterceptor])),
provideAuth({
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
}),
```

---

## Тестирование

- `TokenStorageService`: юнит-тесты с mock localStorage
- `authGuard`: тест с токеном (→ `true`) и без (→ redirect)
- `authInterceptor`: тест добавления заголовка; тест 401 → refresh → retry; тест 401 при неудачном refresh → redirect; тест очереди параллельных запросов
