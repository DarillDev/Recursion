import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, Router } from '@angular/router';
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
