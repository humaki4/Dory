import { FastifyRequest } from 'fastify';

export function getTokenFromRequest(
  request: FastifyRequest,
  sessionCookieName: string
): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token.length > 0) {
      return token;
    }
  }

  const cookieToken = request.cookies?.[sessionCookieName];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}
