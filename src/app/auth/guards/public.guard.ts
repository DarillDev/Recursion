import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { AuthService } from '../services/auth/auth-state.service';

export const publicGuard: CanActivateFn = () => {
  const authState = inject(AuthService);
  const config = inject(AUTH_CONFIG);
  const router = inject(Router);

  return authState.isAuthenticated()
    ? router.createUrlTree([config.redirects.onAuthenticated])
    : true;
};
