import { BadRequestError } from '../../core/errors';
import { SupportedProvider } from './types';

export const SESSION_COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME || 'docatlas_session';
export const GITHUB_ACCESS_COOKIE_NAME =
  process.env.AUTH_GITHUB_ACCESS_COOKIE_NAME || 'docatlas_github_access';
export const GITLAB_ACCESS_COOKIE_NAME =
  process.env.AUTH_GITLAB_ACCESS_COOKIE_NAME || 'docatlas_gitlab_access';
export const SESSION_TTL = process.env.AUTH_TOKEN_TTL || '8h';
export const STATE_TTL_MS = 10 * 60 * 1000;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function getBackendBaseUrl(): string {
  return process.env.AUTH_BACKEND_PUBLIC_URL || 'http://localhost:3000';
}

export function getClientRedirectUrl(): string {
  return process.env.AUTH_CLIENT_SUCCESS_REDIRECT_URL || 'http://localhost:5173';
}

export function isGitlabAuthEnabled(): boolean {
  return parseBoolean(process.env.AUTH_GITLAB_ENABLED, false);
}

export function getGitlabBaseUrl(): string {
  return normalizeBaseUrl(process.env.AUTH_GITLAB_BASE_URL || 'https://gitlab.com');
}

export function isProviderEnabled(provider: SupportedProvider): boolean {
  if (provider === 'github') {
    return true;
  }

  return isGitlabAuthEnabled();
}

export function getActiveAuthProvider(): SupportedProvider {
  return isGitlabAuthEnabled() ? 'gitlab' : 'github';
}

export function assertProviderEnabled(provider: SupportedProvider): void {
  if (!isProviderEnabled(provider)) {
    throw new BadRequestError(`OAuth for ${provider} is disabled`);
  }
}

export function getProviderConfig(provider: SupportedProvider): {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
} {
  assertProviderEnabled(provider);

  const upper = provider.toUpperCase();
  const clientId = process.env[`AUTH_${upper}_CLIENT_ID`];
  const clientSecret = process.env[`AUTH_${upper}_CLIENT_SECRET`];
  const callbackUrl =
    process.env[`AUTH_${upper}_REDIRECT_URI`] ||
    `${getBackendBaseUrl()}/api/auth/${provider}/callback`;

  if (!clientId || !clientSecret) {
    throw new BadRequestError(`OAuth for ${provider} is not configured`);
  }

  return {
    clientId,
    clientSecret,
    callbackUrl,
  };
}
