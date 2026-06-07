/** Конфигурация HTTP-клиента, передаётся через provideApiConfig(). */
export interface IApiConfig {
  /** Базовый URL API, к которому ApiService добавляет path. */
  baseUrl: string;
  /** Таймаут запроса в миллисекундах. По умолчанию 30 000 (30 сек). */
  timeoutInMs?: number;
}
