import { TokenStorageService } from './token-storage.service';
import { Token } from '../../models/token';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  it('returns null when storage is empty', () => {
    expect(service.getToken()).toBeNull();
  });

  it('returns null when only one key is present', () => {
    localStorage.setItem('auth_access_token', 'acc');
    expect(service.getToken()).toBeNull();
  });

  it('stores and retrieves token as Token instance', () => {
    service.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    const token = service.getToken();
    expect(token).toBeInstanceOf(Token);
    expect(token?.accessToken).toBe('acc');
    expect(token?.refreshToken).toBe('ref');
  });

  it('clears token', () => {
    service.setToken({ accessToken: 'acc', refreshToken: 'ref' });
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_access_token')).toBeNull();
    expect(localStorage.getItem('auth_refresh_token')).toBeNull();
  });

  it('overwrites existing token on setToken', () => {
    service.setToken({ accessToken: 'old', refreshToken: 'old-ref' });
    service.setToken({ accessToken: 'new', refreshToken: 'new-ref' });
    const token = service.getToken();
    expect(token?.accessToken).toBe('new');
    expect(token?.refreshToken).toBe('new-ref');
  });
});
