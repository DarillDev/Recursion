import { inject, Injectable } from '@angular/core';
import type { Observable} from 'rxjs';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { AuthHttpService } from '../auth-http/auth-http.service';
import { decodeJwtExp } from '../../utils/jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authHttp = inject(AuthHttpService);

  public initialize(): Observable<null> {
    const token = this.tokenStorage.getToken();

    if (!token) {
      return of(null);
    }

    const exp = decodeJwtExp(token.accessToken);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const isExpired = exp === null || nowSeconds >= exp;

    if (!isExpired) {
      return of(null);
    }

    return this.authHttp.refreshToken(token.refreshToken).pipe(
      map((response) => {
        this.tokenStorage.setToken(response.token);
        return null;
      }),
      catchError(() => {
        this.tokenStorage.clearToken();
        return of(null);
      }),
    );
  }
}
