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
