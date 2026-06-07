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

    const req1 = httpMock.expectOne('/api/data');
    expect(req1.request.headers.get('Authorization')).toBe('Bearer old-access');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${CONFIG.authUrl}/front/logon/refresh-token`);
    expect(refreshReq.request.body).toEqual({ refreshToken: 'old-refresh' });
    refreshReq.flush(REFRESH_RESPONSE);

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

    const refreshReqs = httpMock.match(`${CONFIG.authUrl}/front/logon/refresh-token`);
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0].flush(REFRESH_RESPONSE);

    const retries = httpMock.match((r) => r.url.includes('/api/'));
    expect(retries.length).toBe(2);
    retries.forEach((r) => r.flush({}));
  });
});
