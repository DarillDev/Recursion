import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthInitService } from './auth-init.service';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { AUTH_CONFIG } from '../../config/auth-config.token';

const CONFIG = {
  authUrl: 'https://auth.example.com',
  redirects: { onUnauthenticated: '/login', onAuthenticated: '/categories' },
};

function makeJwt(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const payload = btoa(JSON.stringify({ UserId: '2', exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `header.${payload}.sig`;
}

const REFRESH_RESPONSE = {
  user: { displayName: 'test', timezoneOffset: '03:00:00' },
  token: 'new-access',
  refreshToken: 'new-refresh',
};

describe('AuthInitService', () => {
  let service: AuthInitService;
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
    service = TestBed.inject(AuthInitService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('completes immediately when no token in storage', (done) => {
    service.initialize().subscribe({ complete: () => done() });
    httpMock.expectNone(`${CONFIG.authUrl}/front/logon/refresh-token`);
  });

  it('completes immediately when access token is not expired', (done) => {
    const validToken = makeJwt(+3600);
    tokenStorage.setToken({ accessToken: validToken, refreshToken: 'ref' });

    service.initialize().subscribe({ complete: () => done() });
    httpMock.expectNone(`${CONFIG.authUrl}/front/logon/refresh-token`);
  });

  it('refreshes and stores new token when access token is expired', (done) => {
    const expiredToken = makeJwt(-60);
    tokenStorage.setToken({ accessToken: expiredToken, refreshToken: 'old-refresh' });

    service.initialize().subscribe({
      complete: () => {
        expect(tokenStorage.getToken()).toEqual({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        });
        done();
      },
    });

    const req = httpMock.expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`);
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
    req.flush(REFRESH_RESPONSE);
  });

  it('clears token and completes without error when refresh fails', (done) => {
    const expiredToken = makeJwt(-60);
    tokenStorage.setToken({ accessToken: expiredToken, refreshToken: 'old-refresh' });

    service.initialize().subscribe({
      complete: () => {
        expect(tokenStorage.getToken()).toBeNull();
        done();
      },
      error: () => done.fail('should not error'),
    });

    httpMock
      .expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('treats token with undecodable exp as expired and attempts refresh', (done) => {
    tokenStorage.setToken({ accessToken: 'not.a.jwt', refreshToken: 'ref' });

    service.initialize().subscribe({ complete: () => done() });

    httpMock
      .expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`)
      .flush(REFRESH_RESPONSE);
  });
});
