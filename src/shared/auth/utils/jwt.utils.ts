export function decodeJwtExp(token: string): number | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as unknown;

    if (typeof payload !== 'object' || payload === null || !('exp' in payload)) {
      return null;
    }

    const { exp } = payload as { exp: unknown };
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}
