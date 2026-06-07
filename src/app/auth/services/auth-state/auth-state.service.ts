import { computed, inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { IToken } from '../../interfaces/token.interface';
import type { ILoginResponse } from '../../interfaces/login-response.interface';
import { Token } from '../../models/token';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { AuthApiService } from '../auth-api/auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authApi = inject(AuthApiService);

  // Инициализируем из localStorage один раз — дальнейшие обращения только к сигналу.
  private readonly _token = signal<Token | null>(this.tokenStorage.getToken());

  public readonly token = this._token.asReadonly();
  public readonly isAuthenticated = computed(() => this._token() !== null);

  /**
   * Вызывается при старте приложения.
   * Если токен просрочен — пробует обновить; при ошибке очищает хранилище.
   * Всегда завершается без ошибки, чтобы не блокировать bootstrap.
   */
  public initialize(): Observable<null> {
    const token = this._token();

    if (!token) {
      return of(null);
    }

    if (!token.isExpired) {
      return of(null);
    }

    return this.refreshToken().pipe(
      map(() => null),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  /** Выполняет вход, сохраняет токен в памяти и localStorage. */
  public login(username: string, password: string): Observable<void> {
    return this.authApi.login(username, password).pipe(
      tap((response) => this.saveToken(response.token)),
      map(() => undefined),
    );
  }

  /** Очищает токен из памяти и localStorage. */
  public logout(): void {
    this.tokenStorage.clearToken();
    this._token.set(null);
  }

  /**
   * Обновляет пару токенов и сохраняет результат в памяти и localStorage.
   * При отсутствии refresh-токена бросает ошибку синхронно.
   */
  public refreshToken(): Observable<ILoginResponse> {
    const token = this._token();

    if (!token?.refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.authApi.refreshToken(token.refreshToken).pipe(
      tap((response) => this.saveToken(response.token)),
    );
  }

  private saveToken(raw: IToken): void {
    const token = new Token(raw.accessToken, raw.refreshToken);
    this.tokenStorage.setToken(token);
    this._token.set(token);
  }
}
