import { Injectable } from '@angular/core';
import type { IToken } from '../../interfaces/token.interface';

const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  public getToken(): IToken | null {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  public setToken(token: IToken): void {
    localStorage.setItem(ACCESS_KEY, token.accessToken);
    localStorage.setItem(REFRESH_KEY, token.refreshToken);
  }

  public clearToken(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
