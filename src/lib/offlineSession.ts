/** A cached identity opens local learning only; server requests still require a valid authenticated session. */
export function cachedOfflineSession<T>(raw: string | null, online: boolean): T | null {
  if (online || !raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value && typeof value.access_token === 'string' && value.access_token.length > 0
      && typeof value.refresh_token === 'string' && value.refresh_token.length > 0
      && value.user && typeof value.user.id === 'string' && value.user.id.length > 0) return value as T;
  } catch { /* Invalid storage must never prevent the login screen from loading. */ }
  return null;
}
