import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { buildParams } from './utils/build-params.function';

/**
 * Базовый HTTP-сервис. Инкапсулирует работу с HttpClient, построение URL из api-конфига
 * и сериализацию query-параметров. Используется через DI в feature-сервисах вместо httpClient.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly apiConfig = inject(API_CONFIG);

  private readonly httpClient = inject(HttpClient);

  public get baseUrl(): string {
    return this.apiConfig.baseUrl;
  }

  public get<T>(path: string, params?: object): Observable<T> {
    return this.httpClient.get<T>(
      this.buildUrl(path),
      params ? { params: buildParams(params) } : {},
    );
  }

  public post<T>(path: string, body: unknown): Observable<T> {
    return this.httpClient.post<T>(this.buildUrl(path), body);
  }

  public put<T>(path: string, body: unknown): Observable<T> {
    return this.httpClient.put<T>(this.buildUrl(path), body);
  }

  public patch<T>(path: string, body: unknown): Observable<T> {
    return this.httpClient.patch<T>(this.buildUrl(path), body);
  }

  public delete<T>(path: string): Observable<T> {
    return this.httpClient.delete<T>(this.buildUrl(path));
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
