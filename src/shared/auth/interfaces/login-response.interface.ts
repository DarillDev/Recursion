import type { IAuthUser } from './auth-user.interface';
import type { IToken } from './token.interface';

export interface ILoginResponse {
  user: IAuthUser;
  token: IToken;
}
