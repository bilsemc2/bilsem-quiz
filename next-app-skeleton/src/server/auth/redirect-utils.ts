const DEFAULT_NEXT_PATH = '/dashboard';

const BLOCKED_PREFIXES = ['/login', '/signup', '/forgot-password', '/auth/callback'];

export function normalizeNextPath(nextPathRaw: string | null | undefined, fallback = DEFAULT_NEXT_PATH): string {
  if (!nextPathRaw) {
    return fallback;
  }

  const nextPath = nextPathRaw.trim();

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallback;
  }

  if (BLOCKED_PREFIXES.some((prefix) => nextPath.startsWith(prefix))) {
    return fallback;
  }

  return nextPath;
}

export function buildPathWithQuery(pathname: string, params: Record<string, string | null | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim().length > 0) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}
