import type { IToken } from '../interfaces/token.interface';
import { decodeJwtExp } from '../utils/jwt.utils';

export class Token implements IToken {
  public readonly accessToken: string;
  public readonly refreshToken: string;

  constructor({ accessToken, refreshToken }: IToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public get isExpired(): boolean {
    const exp = decodeJwtExp(this.accessToken);

    return exp === null || Math.floor(Date.now() / 1000) >= exp;
  }
}
