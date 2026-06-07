export interface IAuthConfig {
  /** Базовый URL сервера авторизации */
  authUrl: string;
  redirects: {
    /** Роут для неавторизованных пользователей, напр. '/login' */
    onUnauthenticated: string;
    /** Роут для уже авторизованных пользователей, напр. '/categories' */
    onAuthenticated: string;
  };
}
