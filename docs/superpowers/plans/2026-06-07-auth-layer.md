# Auth Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать самодостаточный слой авторизации `app/auth/` с JWT-хранилищем, HTTP-сервисом, interceptor (401 → refresh → retry), authGuard, publicGuard и DI-конфигом `provideAuth()`.

**Architecture:** `app/auth/` — изолированный top-level модуль без зависимостей от `app/api/` и `app/core/`. Делает HTTP-запросы напрямую через `HttpClient`, используя `authUrl` из `IAuthConfig`. Перехват 401 реализован через реактивную стратегию: interceptor перехватывает ошибку, делает refresh, повторяет запрос; параллельные 401 ставятся в очередь.

**Tech Stack:** Angular 21, TypeScript strict, RxJS, Vitest, `@angular/core/testing` TestBed, `HttpTestingController`.

---

## File Map

| Файл | Действие | Назначение |
|---|---|---|
| `public/environment.json` | modify | добавить `authUrl` |
| `src/app/core/app-environment/interfaces/app-environment.interface.ts` | modify | добавить `authUrl: string` |
| `src/app/core/app-environment/models/app-environment.ts` | modify | добавить getter `authUrl` |
| `src/app/core/app-environment/mappers/app-environment.mapper.ts` | modify | добавить валидацию `authUrl` |
| `tsconfig.app.json` | modify | добавить alias `@auth` |
| `tsconfig.spec.json` | modify | добавить alias `@auth` |
| `src/app/auth/interfaces/auth-config.interface.ts` | create | `IAuthConfig` |
| `src/app/auth/config/auth-config.token.ts` | create | `AUTH_CONFIG` injection token |
| `src/app/auth/interfaces/token.interface.ts` | create | `IToken` |
| `src/app/auth/interfaces/auth-user.interface.ts` | create | `IAuthUser` |
| `src/app/auth/interfaces/login-response.interface.ts` | create | `ILoginResponse` |
| `src/app/auth/models/token.ts` | create | `Token` class |
| `src/app/auth/config/provide-auth.function.ts` | create | `provideAuth()` |
| `src/app/auth/services/token-storage/token-storage.service.ts` | create | `TokenStorageService` |
| `src/app/auth/services/token-storage/token-storage.service.spec.ts` | create | тесты |
| `src/app/auth/services/auth-http/auth-http.service.ts` | create | `AuthHttpService` |
| `src/app/auth/services/auth-http/auth-http.service.spec.ts` | create | тесты |
| `src/app/auth/guards/auth.guard.ts` | create | `authGuard` |
| `src/app/auth/guards/auth.guard.spec.ts` | create | тесты |
| `src/app/auth/guards/public.guard.ts` | create | `publicGuard` |
| `src/app/auth/guards/public.guard.spec.ts` | create | тесты |
| `src/app/auth/interceptors/auth.interceptor.ts` | create | `authInterceptor` |
| `src/app/auth/interceptors/auth.interceptor.spec.ts` | create | тесты |
| `src/app/auth/index.ts` | create | barrel |
| `src/app/app.config-resolver.ts` | modify | добавить `provideAuth()` и `authInterceptor` |

---

## Task 1: Добавить `authUrl` в AppEnvironment

**Files:**
- Modify: `public/environment.json`
- Modify: `src/app/core/app-environment/interfaces/app-environment.interface.ts`
- Modify: `src/app/core/app-environment/models/app-environment.ts`
- Modify: `src/app/core/app-environment/mappers/app-environment.mapper.ts`

- [ ] **Step 1: Обновить `environment.json`**

```json
{
  "apiUrl": "https://zidium3-backend.zidium.net",
  "authUrl": "https://zidium3-backend.zidium.net",
  "title": "Indigo Soft"
}
```

- [ ] **Step 2: Обновить интерфейс**

Файл `src/app/core/app-environment/interfaces/app-environment.interface.ts`:

```ts
/** Конфигурация окружения приложения */
export interface IAppEnvironment {
  /** Базовый URL API-сервера */
  apiUrl: string;
  /** Базовый URL сервера авторизации */
  authUrl: string;
  /** Название приложения */
  title: string;
}
```

- [ ] **Step 3: Обновить модель**

Файл `src/app/core/app-environment/models/app-environment.ts`:

```ts
import { IAppEnvironment } from '../interfaces/app-environment.interface';

export class AppEnvironment implements IAppEnvironment {
  constructor(private readonly source: IAppEnvironment) {}

  public get apiUrl(): string {
    return this.source.apiUrl;
  }

  public get authUrl(): string {
    return this.source.authUrl;
  }

  public get title(): string {
    return this.source.title;
  }
}
```

- [ ] **Step 4: Обновить маппер**

Файл `src/app/core/app-environment/mappers/app-environment.mapper.ts`:

```ts
import { IAppEnvironment } from '../interfaces/app-environment.interface';
import { AppEnvironment } from '../models/app-environment';

export class AppEnvironmentMapper {
  public static fromDto<T extends IAppEnvironment>(dto: Partial<T>): AppEnvironment {
    if (!dto.apiUrl) {
      throw new Error('environment.json does NOT have - apiUrl');
    }

    if (!dto.authUrl) {
      throw new Error('environment.json does NOT have - authUrl');
    }

    if (!dto.title) {
      throw new Error('environment.json does NOT have - title');
    }

    return new AppEnvironment(dto as IAppEnvironment);
  }
}
```

- [ ] **Step 5: Проверить компиляцию**

```bash
npm run build 2>&1 | tail -20
```

Ожидание: компиляция без ошибок.

- [ ] **Step 6: Commit**

```bash
git add public/environment.json src/app/core/app-environment/interfaces/app-environment.interface.ts src/app/core/app-environment/models/app-environment.ts src/app/core/app-environment/mappers/app-environment.mapper.ts
git commit -m "feat(env): add authUrl to AppEnvironment"
```

---

## Task 2: Добавить alias `@auth` в tsconfig

**Files:**
- Modify: `tsconfig.app.json`
- Modify: `tsconfig.spec.json`

- [ ] **Step 1: Обновить `tsconfig.app.json`**

В секцию `paths` добавить:

```json
"@auth": ["src/app/auth/"]
```

Итоговый `paths`:

```json
"paths": {
  "@core/app-env": ["src/app/core/app-environment/index.ts"],
  "@api/core": ["src/app/api/core/index.ts"],
  "@api/config": ["src/app/api/config/index.ts"],
  "@api/*": ["src/app/api/controllers/*/index.ts"],
  "@auth": ["src/app/auth/"]
}
```

- [ ] **Step 2: Обновить `tsconfig.spec.json`** — добавить тот же `@auth` в `paths`.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.app.json tsconfig.spec.json
git commit -m "feat(tsconfig): add @auth path alias"
```

---

## Task 3: Создать интерфейсы, модели и DI-конфиг

**Files:**
- Create: `src/app/auth/interfaces/auth-config.interface.ts`
- Create: `src/app/auth/config/auth-config.token.ts`
- Create: `src/app/auth/interfaces/token.interface.ts`
- Create: `src/app/auth/interfaces/auth-user.interface.ts`
- Create: `src/app/auth/interfaces/login-response.interface.ts`
- Create: `src/app/auth/models/token.ts`
- Create: `src/app/auth/config/provide-auth.function.ts`

- [ ] **Step 1: `IAuthConfig`**

Файл `src/app/auth/interfaces/auth-config.interface.ts`:

```ts
export interface IAuthConfig {
  /** Базовый URL сервера авторизации */
  authUrl: string;
  redirects: {
    /** Роут для неавторизованных пользователей, напр. '/login' */
    onUnauthenticated: string;
    /** Роут для уже авторизованных пользователей, напр. '/categories' */
    onAuthenticated: string;
  };
}
```

- [ ] **Step 2: `AUTH_CONFIG` token**

Файл `src/app/auth/config/auth-config.token.ts`:

```ts
import { InjectionToken } from '@angular/core';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const AUTH_CONFIG = new InjectionToken<IAuthConfig>('AUTH_CONFIG');
```

- [ ] **Step 3: `IToken`**

Файл `src/app/auth/interfaces/token.interface.ts`:

```ts
export interface IToken {
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 4: `IAuthUser`**

Файл `src/app/auth/interfaces/auth-user.interface.ts`:

```ts
export interface IAuthUser {
  displayName: string;
  timezoneOffset: string;
}
```

- [ ] **Step 5: `ILoginResponse`**

Файл `src/app/auth/interfaces/login-response.interface.ts`:

```ts
import type { IAuthUser } from './auth-user.interface';
import type { IToken } from './token.interface';

export interface ILoginResponse {
  user: IAuthUser;
  token: IToken;
}
```

- [ ] **Step 6: `Token` модель**

Файл `src/app/auth/models/token.ts`:

```ts
import type { IToken } from '../interfaces/token.interface';

export class Token implements IToken {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
```

- [ ] **Step 7: `provideAuth()`**

Файл `src/app/auth/config/provide-auth.function.ts`:

```ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_CONFIG } from './auth-config.token';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const provideAuth = (config: IAuthConfig): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: AUTH_CONFIG, useValue: config }]);
```

- [ ] **Step 8: Commit**

```bash
git add src/app/auth/
git commit -m "feat(auth): add interfaces, models and DI config"
```

---

## Task 4: TokenStorageService (TDD)

**Files:**
- Create: `src/app/auth/services/token-storage/token-storage.service.ts`
- Create: `src/app/auth/services/token-storage/token-storage.service.spec.ts`

- [ ] **Step 1: Написать тесты**

Файл `src/app/auth/services/token-storage/token-storage.service.spec.ts`:

```ts
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  it('returns null when storage is empty', () => {
    expect(service.getToken()).toBeNull();
  });

  it('returns null when only one key is present', () => {
    localStorage.setItem('auth_access_token', 'acc');
    expect(service.getToken()).toBeNull();
  });

  it('stores and retrieves token', () => {
    service.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    expect(service.getToken()).toEqual({ accessToken: 'acc', refreshToken: 'ref' });
  });

  it('clears token', () => {
    service.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_access_token')).toBeNull();
    expect(localStorage.getItem('auth_refresh_token')).toBeNull();
  });

  it('overwrites existing token on setToken', () => {
    service.setToken({ accessToken: 'old', refreshToken: 'old-ref' });
    service.setToken({ accessToken: 'new', refreshToken: 'new-ref' });
    expect(service.getToken()).toEqual({ accessToken: 'new', refreshToken: 'new-ref' });
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что FAIL**

```bash
npx ng test --include="src/app/auth/services/token-storage/token-storage.service.spec.ts" 2>&1 | tail -20
```

Ожидание: ошибка "Cannot find module".

- [ ] **Step 3: Реализовать `TokenStorageService`**

Файл `src/app/auth/services/token-storage/token-storage.service.ts`:

```ts
import { Injectable } from '@angular/core';
import type { IToken } from '../../interfaces/token.interface';

const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  public getToken(): IToken | null {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  public setToken(token: IToken): void {
    localStorage.setItem(ACCESS_KEY, token.accessToken);
    localStorage.setItem(REFRESH_KEY, token.refreshToken);
  }

  public clearToken(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
```

- [ ] **Step 4: Запустить тесты — убедиться что PASS**

```bash
npx ng test --include="src/app/auth/services/token-storage/token-storage.service.spec.ts" 2>&1 | tail -20
```

Ожидание: все 5 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/services/token-storage/
git commit -m "feat(auth): implement TokenStorageService"
```

---

## Task 5: AuthHttpService (TDD)

**Files:**
- Create: `src/app/auth/services/auth-http/auth-http.service.ts`
- Create: `src/app/auth/services/auth-http/auth-http.service.spec.ts`

Сервер возвращает `token` (string) и `refreshToken` (string) на верхнем уровне. Сервис маппит их в `IToken.accessToken` и `IToken.refreshToken`.

- [ ] **Step 1: Написать тесты**

Файл `src/app/auth/services/auth-http/auth-http.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthHttpService } from './auth-http.service';
import { AUTH_CONFIG } from '../../config/auth-config.token';
import type { ILoginResponse } from '../../interfaces/login-response.interface';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

const SERVER_RESPONSE = {
  user: { displayName: 'test', timezoneOffset: '03:00:00' },
  token: 'access-token-value',
  refreshToken: 'refresh-token-value',
};

describe('AuthHttpService', () => {
  let service: AuthHttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: CONFIG },
      ],
    });
    service = TestBed.inject(AuthHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('login()', () => {
    it('sends POST to /front/logon with credentials', () => {
      service.login('test', '77777').subscribe();

      const req = httpMock.expectOne(`${CONFIG.authUrl}/front/logon`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ login: 'test', password: '77777' });
      req.flush(SERVER_RESPONSE);
    });

    it('maps server token string to IToken.accessToken', () => {
      let result: ILoginResponse | undefined;
      service.login('test', '77777').subscribe((r) => (result = r));

      httpMock.expectOne(`${CONFIG.authUrl}/front/logon`).flush(SERVER_RESPONSE);

      expect(result).toEqual({
        user: { displayName: 'test', timezoneOffset: '03:00:00' },
        token: { accessToken: 'access-token-value', refreshToken: 'refresh-token-value' },
      });
    });
  });

  describe('refreshToken()', () => {
    it('sends POST to /front/logon/refresh-token with refreshToken', () => {
      service.refreshToken('old-refresh').subscribe();

      const req = httpMock.expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
      req.flush(SERVER_RESPONSE);
    });

    it('maps refreshed token correctly', () => {
      let result: ILoginResponse | undefined;
      service.refreshToken('old-refresh').subscribe((r) => (result = r));

      httpMock
        .expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`)
        .flush({ ...SERVER_RESPONSE, token: 'new-access', refreshToken: 'new-refresh' });

      expect(result!.token).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что FAIL**

```bash
npx ng test --include="src/app/auth/services/auth-http/auth-http.service.spec.ts" 2>&1 | tail -20
```

- [ ] **Step 3: Реализовать `AuthHttpService`**

Файл `src/app/auth/services/auth-http/auth-http.service.ts`:

```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AUTH_CONFIG } from '../../config/auth-config.token';
import type { ILoginResponse } from '../../interfaces/login-response.interface';
import type { IAuthUser } from '../../interfaces/auth-user.interface';

interface ILoginResponseDto {
  user: IAuthUser;
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AUTH_CONFIG);

  public login(login: string, password: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponseDto>(`${this.config.authUrl}/front/logon`, { login, password })
      .pipe(map((dto) => this.mapDto(dto)));
  }

  public refreshToken(refreshToken: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponseDto>(`${this.config.authUrl}/front/logon/refresh-token`, { refreshToken })
      .pipe(map((dto) => this.mapDto(dto)));
  }

  private mapDto(dto: ILoginResponseDto): ILoginResponse {
    return {
      user: dto.user,
      token: { accessToken: dto.token, refreshToken: dto.refreshToken },
    };
  }
}
```

- [ ] **Step 4: Запустить тесты — убедиться что PASS**

```bash
npx ng test --include="src/app/auth/services/auth-http/auth-http.service.spec.ts" 2>&1 | tail -20
```

Ожидание: 4 теста PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/services/auth-http/
git commit -m "feat(auth): implement AuthHttpService"
```

---

## Task 6: authGuard и publicGuard (TDD)

**Files:**
- Create: `src/app/auth/guards/auth.guard.ts`
- Create: `src/app/auth/guards/auth.guard.spec.ts`
- Create: `src/app/auth/guards/public.guard.ts`
- Create: `src/app/auth/guards/public.guard.spec.ts`

- [ ] **Step 1: Написать тесты для `authGuard`**

Файл `src/app/auth/guards/auth.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenStorageService } from '../services/token-storage/token-storage.service';
import { AUTH_CONFIG } from '../config/auth-config.token';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

describe('authGuard', () => {
  let tokenStorage: TokenStorageService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_CONFIG, useValue: CONFIG }],
    });
    tokenStorage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
  });

  it('returns true when token exists', () => {
    tokenStorage.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });

  it('redirects to onUnauthenticated when no token', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});
```

- [ ] **Step 2: Написать тесты для `publicGuard`**

Файл `src/app/auth/guards/public.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { publicGuard } from './public.guard';
import { TokenStorageService } from '../services/token-storage/token-storage.service';
import { AUTH_CONFIG } from '../config/auth-config.token';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

describe('publicGuard', () => {
  let tokenStorage: TokenStorageService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_CONFIG, useValue: CONFIG }],
    });
    tokenStorage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
  });

  it('returns true when no token', () => {
    const result = TestBed.runInInjectionContext(() =>
      publicGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });

  it('redirects to onAuthenticated when token exists', () => {
    tokenStorage.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    const result = TestBed.runInInjectionContext(() =>
      publicGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toEqual(router.createUrlTree(['/categories']));
  });
});
```

- [ ] **Step 3: Запустить тесты — убедиться что FAIL**

```bash
npx ng test --include="src/app/auth/guards/*.spec.ts" 2>&1 | tail -20
```

- [ ] **Step 4: Реализовать `authGuard`**

Файл `src/app/auth/guards/auth.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { TokenStorageService } from '../services/token-storage/token-storage.service';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const config = inject(AUTH_CONFIG);
  const router = inject(Router);

  return tokenStorage.getToken() !== null
    ? true
    : router.createUrlTree([config.redirects.onUnauthenticated]);
};
```

- [ ] **Step 5: Реализовать `publicGuard`**

Файл `src/app/auth/guards/public.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { TokenStorageService } from '../services/token-storage/token-storage.service';

export const publicGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const config = inject(AUTH_CONFIG);
  const router = inject(Router);

  return tokenStorage.getToken() === null
    ? true
    : router.createUrlTree([config.redirects.onAuthenticated]);
};
```

- [ ] **Step 6: Запустить тесты — убедиться что PASS**

```bash
npx ng test --include="src/app/auth/guards/*.spec.ts" 2>&1 | tail -20
```

Ожидание: 4 теста PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/auth/guards/
git commit -m "feat(auth): implement authGuard and publicGuard"
```

---

## Task 7: authInterceptor (TDD)

**Files:**
- Create: `src/app/auth/interceptors/auth.interceptor.ts`
- Create: `src/app/auth/interceptors/auth.interceptor.spec.ts`

Interceptor: добавляет `Authorization: Bearer` заголовок; на 401 — обновляет токен и повторяет запрос; параллельные 401 ставятся в очередь; при неудачном refresh — очищает токен и редиректит.

- [ ] **Step 1: Написать тесты**

Файл `src/app/auth/interceptors/auth.interceptor.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { TokenStorageService } from '../services/token-storage/token-storage.service';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

const REFRESH_RESPONSE = {
  user: { displayName: 'test', timezoneOffset: '03:00:00' },
  token: 'new-access',
  refreshToken: 'new-refresh',
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AUTH_CONFIG, useValue: CONFIG },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('adds Authorization header when token exists', () => {
    tokenStorage.setToken({ accessToken: 'my-access', refreshToken: 'my-refresh' });

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-access');
    req.flush({});
  });

  it('does not add Authorization header when no token', () => {
    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('does not add Authorization header for authUrl requests', () => {
    tokenStorage.setToken({ accessToken: 'my-access', refreshToken: 'my-refresh' });

    http.post(`${CONFIG.authUrl}/front/logon`, {}).subscribe();

    const req = httpMock.expectOne(`${CONFIG.authUrl}/front/logon`);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('refreshes token on 401 and retries with new token', () => {
    tokenStorage.setToken({ accessToken: 'old-access', refreshToken: 'old-refresh' });
    let responseData: unknown;

    http.get('/api/data').subscribe((data) => (responseData = data));

    // Первый запрос получает 401
    const req1 = httpMock.expectOne('/api/data');
    expect(req1.request.headers.get('Authorization')).toBe('Bearer old-access');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Запрос на обновление токена
    const refreshReq = httpMock.expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`);
    expect(refreshReq.request.body).toEqual({ refreshToken: 'old-refresh' });
    refreshReq.flush(REFRESH_RESPONSE);

    // Повторный запрос с новым токеном
    const req2 = httpMock.expectOne('/api/data');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer new-access');
    req2.flush({ ok: true });

    expect(responseData).toEqual({ ok: true });
  });

  it('clears token and redirects on failed refresh', () => {
    tokenStorage.setToken({ accessToken: 'old-access', refreshToken: 'old-refresh' });
    const navigateSpy = vi.spyOn(router, 'navigate');
    let errorCaught = false;

    http.get('/api/data').subscribe({ error: () => (errorCaught = true) });

    httpMock
      .expectOne('/api/data')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock
      .expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStorage.getToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(errorCaught).toBe(true);
  });

  it('does not send multiple refresh requests for parallel 401s', () => {
    tokenStorage.setToken({ accessToken: 'old-access', refreshToken: 'old-refresh' });

    http.get('/api/one').subscribe();
    http.get('/api/two').subscribe();

    const [req1, req2] = httpMock.match((r) => r.url.includes('/api/'));
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });
    req2.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Должен быть только один refresh-запрос
    const refreshReqs = httpMock.match(`${CONFIG.authUrl}/front/logon/refresh-token`);
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0].flush(REFRESH_RESPONSE);

    // Оба исходных запроса должны быть повторены
    const retries = httpMock.match((r) => r.url.includes('/api/'));
    expect(retries.length).toBe(2);
    retries.forEach((r) => r.flush({}));
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что FAIL**

```bash
npx ng test --include="src/app/auth/interceptors/auth.interceptor.spec.ts" 2>&1 | tail -20
```

- [ ] **Step 3: Реализовать `authInterceptor`**

Файл `src/app/auth/interceptors/auth.interceptor.ts`:

```ts
import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { AuthHttpService } from '../services/auth-http/auth-http.service';
import { TokenStorageService } from '../services/token-storage/token-storage.service';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function addAuthHeader(req: HttpRequest<unknown>, accessToken: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}

function flushQueue(): void {
  const queue = refreshQueue;
  refreshQueue = [];
  queue.forEach((fn) => fn());
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const config = inject(AUTH_CONFIG);
  const router = inject(Router);
  const authHttp = inject(AuthHttpService);

  if (req.url.startsWith(config.authUrl)) {
    return next(req);
  }

  const token = tokenStorage.getToken();
  const authReq = token ? addAuthHeader(req, token.accessToken) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return handle401(req, next, tokenStorage, config, router, authHttp);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  config: ReturnType<typeof inject<typeof AUTH_CONFIG>>,
  router: Router,
  authHttp: AuthHttpService,
): Observable<unknown> {
  const currentToken = tokenStorage.getToken();

  if (!currentToken?.refreshToken) {
    tokenStorage.clearToken();
    void router.navigate([config.redirects.onUnauthenticated]);
    return throwError(() => new Error('No refresh token'));
  }

  if (isRefreshing) {
    return new Observable((observer) => {
      refreshQueue.push(() => {
        const newToken = tokenStorage.getToken();
        const retryReq = newToken ? addAuthHeader(req, newToken.accessToken) : req;
        next(retryReq).subscribe(observer);
      });
    });
  }

  isRefreshing = true;

  return authHttp.refreshToken(currentToken.refreshToken).pipe(
    switchMap((response) => {
      tokenStorage.setToken(response.token);
      isRefreshing = false;
      flushQueue();

      return next(addAuthHeader(req, response.token.accessToken));
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshQueue = [];
      tokenStorage.clearToken();
      void router.navigate([config.redirects.onUnauthenticated]);
      return throwError(() => refreshError);
    }),
  );
}
```

**Примечание:** `config` в `handle401` имеет тип `IAuthConfig`. Замени сигнатуру на:

```ts
import type { IAuthConfig } from '../interfaces/auth-config.interface';

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  config: IAuthConfig,
  router: Router,
  authHttp: AuthHttpService,
): Observable<unknown> {
```

- [ ] **Step 4: Запустить тесты — убедиться что PASS**

```bash
npx ng test --include="src/app/auth/interceptors/auth.interceptor.spec.ts" 2>&1 | tail -20
```

Ожидание: 5 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/interceptors/
git commit -m "feat(auth): implement authInterceptor with refresh queue"
```

---

## Task 8: Barrel и интеграция

**Files:**
- Create: `src/app/auth/index.ts`
- Modify: `src/app/app.config-resolver.ts`

- [ ] **Step 1: Создать barrel `index.ts`**

Файл `src/app/auth/index.ts`:

```ts
export { provideAuth } from './config/provide-auth.function';
export { authGuard } from './guards/auth.guard';
export { publicGuard } from './guards/public.guard';
export { authInterceptor } from './interceptors/auth.interceptor';
export { TokenStorageService } from './services/token-storage/token-storage.service';
export { AuthHttpService } from './services/auth-http/auth-http.service';
export type { IAuthConfig } from './interfaces/auth-config.interface';
export type { IToken } from './interfaces/token.interface';
export type { IAuthUser } from './interfaces/auth-user.interface';
export type { ILoginResponse } from './interfaces/login-response.interface';
```

- [ ] **Step 2: Обновить `app.config-resolver.ts`**

Файл `src/app/app.config-resolver.ts`:

```ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppEnvironment, provideAppEnvironment } from '@core/app-env';
import { IApiConfig, provideApiConfig } from '@api/config';
import { authInterceptor, provideAuth } from '@auth';

export const appConfigResolver = (appEnvironment: AppEnvironment): ApplicationConfig => {
  const apiConfig: IApiConfig = { baseUrl: appEnvironment.apiUrl };

  return {
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideApiConfig(apiConfig),
      provideAppEnvironment(appEnvironment),
      provideAuth({
        authUrl: appEnvironment.authUrl,
        redirects: {
          onUnauthenticated: '/login',
          onAuthenticated: '/categories',
        },
      }),
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
    ],
  };
};
```

- [ ] **Step 3: Проверить компиляцию**

```bash
npm run build 2>&1 | tail -20
```

Ожидание: сборка без ошибок.

- [ ] **Step 4: Запустить все тесты**

```bash
npm test 2>&1 | tail -30
```

Ожидание: все тесты PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/index.ts src/app/app.config-resolver.ts
git commit -m "feat(auth): wire up auth layer into app config"
```
