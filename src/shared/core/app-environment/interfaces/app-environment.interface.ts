/** Конфигурация окружения приложения */
export interface IAppEnvironment {
  /** Базовый URL API-сервера */
  apiUrl: string;
  /** Базовый URL сервера авторизации */
  authUrl: string;
  /** Название приложения */
  title: string;
}
