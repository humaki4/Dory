import { FastifyReply } from 'fastify';
import { AuthTokenClaims } from '../../plugins/auth/auth';
import {
  GITHUB_ACCESS_COOKIE_NAME,
  GITLAB_ACCESS_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL,
} from './config';
import { SupportedProvider } from './types';

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}

export async function createSessionToken(
  reply: FastifyReply,
  user: AuthTokenClaims
): Promise<string> {
  return reply.jwtSign(user, {
    expiresIn: SESSION_TTL,
  });
}

export function setSessionCookies(
  reply: FastifyReply,
  sessionToken: string,
  provider: SupportedProvider,
  accessToken: string
) {
  reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
  });

  const accessCookieName =
    provider === 'gitlab' ? GITLAB_ACCESS_COOKIE_NAME : GITHUB_ACCESS_COOKIE_NAME;

  reply.setCookie(accessCookieName, accessToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
  });
}

export function clearSessionCookies(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
  });

  reply.clearCookie(GITHUB_ACCESS_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
  });

  reply.clearCookie(GITLAB_ACCESS_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
  });
}
