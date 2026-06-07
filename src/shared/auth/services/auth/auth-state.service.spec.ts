import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth-state.service';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { AUTH_CONFIG } from '../../config/auth-config.token';
import { Token } from '../../models/token';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

const REFRESH_RESPONSE = {
  user: { displayName: 'test', timezoneOffset: '03:00:00' },
  token: 'new-access',
  refreshToken: 'new-refresh',
};

const LOGIN_RESPONSE = {
  user: { displayName: 'test', timezoneOffset: '03:00:00' },
  token: 'login-access',
  refreshToken: 'login-refresh',
};

describe('AuthStateService', () => {
  let service: AuthService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: CONFIG },
      ],
    });
    service = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('token signal', () => {
    it('is null when storage is empty on startup', () => {
      expect(service.token()).toBeNull();
    });

    it('is populated from localStorage on startup', () => {
      localStorage.setItem('auth_access_token', 'pre-acc');
      localStorage.setItem('auth_refresh_token', 'pre-ref');
      // Re-create service to trigger constructor read
      const freshService = TestBed.runInInjectionContext(() => new AuthService());
      expect(freshService.token()?.accessToken).toBe('pre-acc');
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true after login', async () => {
      const result = firstValueFrom(service.login('test', '77777'));
      httpMock.expectOne(`${CONFIG.authUrl}/front/logon`).flush(LOGIN_RESPONSE);
      await result;
      expect(service.isAuthenticated()).toBe(true);
    });

    it('returns false after logout', async () => {
      const result = firstValueFrom(service.login('test', '77777'));
      httpMock.expectOne(`${CONFIG.authUrl}/front/logon`).flush(LOGIN_RESPONSE);
      await result;

      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('login()', () => {
    it('sends POST to /front/logon and saves token to signal and localStorage', async () => {
      const result = firstValueFrom(service.login('test', '77777'));

      const req = httpMock.expectOne(`${CONFIG.authUrl}/front/logon`);
      expect(req.request.body).toEqual({ login: 'test', password: '77777' });
      req.flush(LOGIN_RESPONSE);

      await result;

      expect(service.token()).toBeInstanceOf(Token);
      expect(service.token()?.accessToken).toBe('login-access');
      expect(tokenStorage.getToken()?.accessToken).toBe('login-access');
    });
  });

  describe('logout()', () => {
    it('clears token from signal and localStorage', async () => {
      const result = firstValueFrom(service.login('test', '77777'));
      httpMock.expectOne(`${CONFIG.authUrl}/front/logon`).flush(LOGIN_RESPONSE);
      await result;

      service.logout();

      expect(service.token()).toBeNull();
      expect(tokenStorage.getToken()).toBeNull();
    });
  });

  describe('refreshToken()', () => {
    it('calls refresh endpoint and updates signal and localStorage', async () => {
      tokenStorage.setToken({ accessToken: 'old-access', refreshToken: 'old-refresh' });
      const freshService = TestBed.runInInjectionContext(() => new AuthService());

      const result = firstValueFrom(freshService.refreshToken());

      httpMock.expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`).flush(REFRESH_RESPONSE);

      await result;

      expect(freshService.token()?.accessToken).toBe('new-access');
    });

    it('errors immediately when no refresh token in storage', async () => {
      let errorCaught = false;
      await firstValueFrom(service.refreshToken()).catch(() => (errorCaught = true));
      expect(errorCaught).toBe(true);
      httpMock.expectNone(`${CONFIG.authUrl}/front/logon/refresh-token`);
    });
  });
});
