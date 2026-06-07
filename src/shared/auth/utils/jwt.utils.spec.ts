import { decodeJwtExp } from './jwt.utils';

function makeJwt(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `header.${encoded}.signature`;
}

describe('decodeJwtExp', () => {
  it('returns exp value from valid JWT', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ UserId: '2', exp });
    expect(decodeJwtExp(token)).toBe(exp);
  });

  it('returns null for malformed token (not 3 parts)', () => {
    expect(decodeJwtExp('not.a')).toBeNull();
  });

  it('returns null if payload is not valid base64', () => {
    expect(decodeJwtExp('header.!!!.signature')).toBeNull();
  });

  it('returns null if exp is missing from payload', () => {
    const token = makeJwt({ UserId: '2' });
    expect(decodeJwtExp(token)).toBeNull();
  });
});
