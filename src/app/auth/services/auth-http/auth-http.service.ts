import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AUTH_CONFIG } from '../../config/auth-config.token';
import type { ILoginResponse } from '../../interfaces/login-response.interface';
import type { IAuthUser } from '../../interfaces/auth-user.interface';

interface ILoginResponseDto {
  user: IAuthUser;
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AUTH_CONFIG);

  public login(login: string, password: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponseDto>(`${this.config.authUrl}/front/logon`, { login, password })
      .pipe(map((dto) => this.mapDto(dto)));
  }

  public refreshToken(refreshToken: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponseDto>(`${this.config.authUrl}/front/logon/refresh-token`, { refreshToken })
      .pipe(map((dto) => this.mapDto(dto)));
  }

  private mapDto(dto: ILoginResponseDto): ILoginResponse {
    return {
      user: dto.user,
      token: { accessToken: dto.token, refreshToken: dto.refreshToken },
    };
  }
}
