import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { AUTH_CONFIG } from '../config/auth-config.token';
import { AuthService } from '../services/auth/auth-state.service';

/**
 * null  — refresh не выполняется.
 * !null — refresh уже запущен; новые 401 подписываются к нему, а не стартуют свой.
 *
 * Объявлена вне функции-интерцептора — должна быть singleton уровня модуля.
 */
let refreshInProgress$: Observable<unknown> | null = null;

/**
 * HTTP-интерцептор авторизации.
 *
 * Отвечает за три вещи:
 *  1. Добавляет заголовок `Authorization: Bearer <token>` к каждому исходящему запросу.
 *  2. При получении 401 автоматически обновляет пару токенов и повторяет запрос.
 *  3. Предотвращает параллельные запросы на обновление токена (refresh-lock):
 *     если refresh уже идёт — все новые 401 ждут его результата, а не запускают свой.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(AUTH_CONFIG);
  const authState = inject(AuthService);
  const router = inject(Router);

  // Запросы к endpoints авторизации (login, refresh) не должны содержать
  // Bearer-заголовок — их пропускаем без модификации.
  if (req.url.startsWith(config.authUrl)) {
    return next(req);
  }

  const token = authState.token();

  // Если токена нет — отправляем запрос как есть: сервер вернёт 401,
  // который обработается ниже.
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token.accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Нет refresh-токена — сессия невосстановима, выходим из системы сразу.
      if (!authState.token()?.refreshToken) {
        authState.logout();
        void router.navigate([config.redirects.onUnauthenticated]);
        return throwError(() => error);
      }

      // --- Refresh lock ---
      // Если refresh ещё не запущен — создаём Observable и сохраняем в `refreshInProgress$`.
      // `shareReplay(1)` гарантирует:
      //   - один HTTP-вызов, сколько бы 401 ни пришло параллельно;
      //   - опоздавшие подписчики мгновенно получают кешированный результат.
      // `authState.refreshToken()` обновляет сигнал и localStorage внутри.
      // `catchError` здесь (а не у каждого подписчика) вызывает logout один раз.
      // `finalize` сбрасывает флаг как при успехе, так и при ошибке.
      if (!refreshInProgress$) {
        refreshInProgress$ = authState.refreshToken().pipe(
          catchError((refreshError) => {
            authState.logout();
            void router.navigate([config.redirects.onUnauthenticated]);
            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshInProgress$ = null;
          }),
          shareReplay(1),
        );
      }

      // Все запросы (и создавший refresh, и параллельные ожидающие) подписываются
      // на один `refreshInProgress$` и повторяют свой запрос после его завершения.
      return (refreshInProgress$ as Observable<unknown>).pipe(
        switchMap(() => {
          const newToken = authState.token();
          const retryReq = newToken
            ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken.accessToken}` } })
            : req;
          return next(retryReq);
        }),
        // Refresh упал — logout уже вызван внутри `refreshInProgress$`,
        // здесь только пробрасываем исходную ошибку 401 вызывающему коду.
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
