import type { IToken } from '../interfaces/token.interface';
import { decodeJwtExp } from '../utils/jwt.utils';

export class Token implements IToken {
  public constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}

  public get isExpired(): boolean {
    const exp = decodeJwtExp(this.accessToken);

    return exp === null || Math.floor(Date.now() / 1000) >= exp;
  }
}
