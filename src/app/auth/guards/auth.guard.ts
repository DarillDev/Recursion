import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { AuthStateService } from '../services/auth-state/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const config = inject(AUTH_CONFIG);
  const router = inject(Router);

  return authState.isAuthenticated()
    ? true
    : router.createUrlTree([config.redirects.onUnauthenticated]);
};
