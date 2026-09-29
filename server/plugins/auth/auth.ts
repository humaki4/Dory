import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../core/errors';
import { authConfig } from './config';
import { isPublicApiPath, normalizePathname } from './authRoutes';
import { createGithubTokenCache } from './github-token-cache';
import { getTokenFromRequest } from './token';
import { verifyAndAttachUser } from './service';

export interface AuthTokenClaims {
  sub: string;
  provider: 'github' | 'gitlab';
  username: string;
  displayName?: string;
  roles: string[];
  orgs: string[];
  teams: string[];
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    getCurrentUser: (request: FastifyRequest) => Promise<AuthTokenClaims | null>;
    setGithubAccessToken: (userId: string, token: string) => void;
    getGithubAccessToken: (userId: string) => string | null;
    getGithubAccessTokenFromRequest: (request: FastifyRequest, userId: string) => string | null;
    clearGithubAccessToken: (userId: string) => void;
    setGitlabAccessToken: (userId: string, token: string) => void;
    getGitlabAccessToken: (userId: string) => string | null;
    getGitlabAccessTokenFromRequest: (request: FastifyRequest, userId: string) => string | null;
    clearGitlabAccessToken: (userId: string) => void;
  }

  interface FastifyRequest {
    currentUser?: AuthTokenClaims;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenClaims;
    user: AuthTokenClaims;
  }
}

function isJwtAuthError(error: unknown): boolean {
  const err = error as { code?: string; name?: string };
  return (
    Boolean(err?.code?.startsWith('FST_JWT_')) ||
    err?.name === 'TokenExpiredError' ||
    err?.name === 'JsonWebTokenError'
  );
}

const authPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  const githubTokenCache = createGithubTokenCache(authConfig.githubTokenCacheTtlMs);
  const gitlabTokenCache = createGithubTokenCache(authConfig.gitlabTokenCacheTtlMs);

  fastify.register(cookie);
  fastify.register(jwt, { secret: authConfig.authSecret });

  fastify.decorate('setGithubAccessToken', (userId: string, token: string) => {
    githubTokenCache.set(userId, token);
  });

  fastify.decorate('getGithubAccessToken', (userId: string) => {
    return githubTokenCache.get(userId);
  });

  fastify.decorate('getGithubAccessTokenFromRequest', (request: FastifyRequest, userId: string) => {
    const cachedToken = fastify.getGithubAccessToken(userId);
    if (cachedToken) {
      return cachedToken;
    }

    const cookieToken = request.cookies?.[authConfig.githubAccessCookieName];
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      fastify.setGithubAccessToken(userId, cookieToken);
      return cookieToken;
    }

    return null;
  });

  fastify.decorate('clearGithubAccessToken', (userId: string) => {
    githubTokenCache.clear(userId);
  });

  fastify.decorate('setGitlabAccessToken', (userId: string, token: string) => {
    gitlabTokenCache.set(userId, token);
  });

  fastify.decorate('getGitlabAccessToken', (userId: string) => {
    return gitlabTokenCache.get(userId);
  });

  fastify.decorate('getGitlabAccessTokenFromRequest', (request: FastifyRequest, userId: string) => {
    const cachedToken = fastify.getGitlabAccessToken(userId);
    if (cachedToken) {
      return cachedToken;
    }

    const cookieToken = request.cookies?.[authConfig.gitlabAccessCookieName];
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      fastify.setGitlabAccessToken(userId, cookieToken);
      return cookieToken;
    }

    return null;
  });

  fastify.decorate('clearGitlabAccessToken', (userId: string) => {
    gitlabTokenCache.clear(userId);
  });

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const token = getTokenFromRequest(request, authConfig.sessionCookieName);
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    try {
      const user = await verifyAndAttachUser<AuthTokenClaims>(request, token, async (jwtToken) =>
        fastify.jwt.verify<AuthTokenClaims>(jwtToken)
      );

      fastify.log.debug(
        { userId: user.sub, provider: user.provider, path: request.url },
        'auth: request authenticated'
      );
    } catch (error) {
      if (error instanceof UnauthorizedError || isJwtAuthError(error)) {
        throw new UnauthorizedError('Authentication required');
      }
      throw error;
    }
  });

  fastify.decorate('getCurrentUser', async (request: FastifyRequest) => {
    const token = getTokenFromRequest(request, authConfig.sessionCookieName);
    if (!token) {
      return null;
    }

    try {
      return await verifyAndAttachUser<AuthTokenClaims>(request, token, async (jwtToken) =>
        fastify.jwt.verify<AuthTokenClaims>(jwtToken)
      );
    } catch {
      return null;
    }
  });

  fastify.addHook('onRequest', async (request) => {
    if (request.method === 'OPTIONS') {
      return;
    }

    const pathname = normalizePathname(request.raw.url);
    if (!pathname || isPublicApiPath(pathname)) {
      fastify.log.debug({ method: request.method, pathname }, 'auth: public path bypassed');
      return;
    }

    await fastify.authenticate(request);
  });

  done();
};

export default fp(authPlugin);
