import type { IToken } from '../interfaces/token.interface';

export class Token implements IToken {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
