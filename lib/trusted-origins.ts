const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

const isIpAddress = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');

/**
 * Addresses the browser may send sign-in requests from. Better Auth rejects any other origin with a 403.
 *
 * The site address from BETTER_AUTH_URL is always trusted, together with its "www." or bare counterpart,
 * because most domains redirect one to the other and visitors can end up on either. Extra addresses can
 * be listed in TRUSTED_ORIGINS, separated by commas (for example a preview URL).
 */
export function trustedOrigins(baseUrl = process.env.BETTER_AUTH_URL, extra = process.env.TRUSTED_ORIGINS) {
  const origins = new Set(LOCAL_ORIGINS);

  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      origins.add(url.origin);
      const host = url.hostname;
      // Only real domain names have a www/bare pair; localhost and IP addresses do not.
      if (host.includes('.') && !isIpAddress(host)) {
        const other = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
        origins.add(`${url.protocol}//${other}${url.port ? `:${url.port}` : ''}`);
      }
    } catch {
      // An unusable BETTER_AUTH_URL is reported by Better Auth itself.
    }
  }

  for (const value of (extra ?? '').split(',')) {
    try {
      if (value.trim()) origins.add(new URL(value.trim()).origin);
    } catch {
      // Ignore entries that are not valid addresses.
    }
  }

  return [...origins];
}
