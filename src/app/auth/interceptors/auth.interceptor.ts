import { inject } from '@angular/core';
import type {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest} from '@angular/common/http';
import {
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import type { IAuthConfig } from '../interfaces/auth-config.interface';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { AuthHttpService } from '../services/auth-http/auth-http.service';
import { TokenStorageService } from '../services/token-storage/token-storage.service';

let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

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
  config: IAuthConfig,
  router: Router,
  authHttp: AuthHttpService,
): Observable<HttpEvent<unknown>> {
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
