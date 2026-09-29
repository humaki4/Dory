const PUBLIC_API_PATHS = new Set(['/api/health', '/api/healthz']);
const AUTH_CALLBACK_RE = /^\/api\/auth\/(github|gitlab)\/(start|callback)$/;
const AUTH_PROVIDER_PATH = '/api/auth/provider';

export function normalizePathname(url: string | undefined): string {
  if (!url) {
    return '';
  }

  const [pathname] = url.split('?');
  return pathname;
}

export function isPublicApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) {
    return true;
  }

  if (PUBLIC_API_PATHS.has(pathname)) {
    return true;
  }

  if (pathname === AUTH_PROVIDER_PATH) {
    return true;
  }

  return AUTH_CALLBACK_RE.test(pathname);
}
