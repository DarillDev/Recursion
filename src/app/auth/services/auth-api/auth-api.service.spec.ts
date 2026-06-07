import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api.service';
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

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: CONFIG },
      ],
    });
    service = TestBed.inject(AuthApiService);
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

      expect(result?.token).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });
  });
});
