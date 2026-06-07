import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { ILoginResponse } from '../../interfaces/login-response.interface';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { AuthApiService } from '../auth-api/auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authApi = inject(AuthApiService);

  /**
   * Вызывается при старте приложения.
   * Если токен просрочен — пробует обновить; при ошибке очищает хранилище.
   * Всегда завершается без ошибки, чтобы не блокировать bootstrap.
   */
  public initialize(): Observable<null> {
    const token = this.tokenStorage.getToken();

    if (!token) {
      return of(null);
    }

    if (!token.isExpired) {
      return of(null);
    }

    return this.refreshToken().pipe(
      map(() => null),
      catchError(() => {
        this.tokenStorage.clearToken();
        return of(null);
      }),
    );
  }

  /**
   * Обновляет пару токенов и сохраняет результат в хранилище.
   * При отсутствии refresh-токена бросает ошибку синхронно.
   */
  public refreshToken(): Observable<ILoginResponse> {
    const token = this.tokenStorage.getToken();

    if (!token?.refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.authApi.refreshToken(token.refreshToken).pipe(
      tap((response) => this.tokenStorage.setToken(response.token)),
    );
  }
}
