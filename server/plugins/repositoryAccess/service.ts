import { FastifyBaseLogger, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../../core/errors';
import { REPO_CACHE_TTL_MS } from './config';
import { createRepositoryAccessCache } from './cache';
import { AuthorizationResultFor, TypedAuthorizationRequest } from './types';
import {
  hasGithubRepositoryAccess,
  loadGithubAuthenticatedUser,
  loadGithubRepositories,
} from './github';

type ResolveGithubAccessToken = (request: FastifyRequest, userSub: string) => string | null;

export type RepositoryAccessService = {
  authorize: <T extends TypedAuthorizationRequest>(
    request: FastifyRequest,
    input: T
  ) => Promise<AuthorizationResultFor<T>>;
};

export function createRepositoryAccessService(
  logger: FastifyBaseLogger,
  resolveGithubAccessToken: ResolveGithubAccessToken
): RepositoryAccessService {
  const cache = createRepositoryAccessCache();

  const getAllowedRepositories = async (request: FastifyRequest): Promise<Set<string>> => {
    const user = request.currentUser;
    if (!user) throw new UnauthorizedError('Authentication required');
    if (user.provider !== 'github') throw new ForbiddenError('Unsupported authentication provider');

    const cacheKey = `${user.provider}:${user.sub}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached.repos;

    const accessToken = resolveGithubAccessToken(request, user.sub);
    if (!accessToken) throw new UnauthorizedError('Authentication session expired');

    await loadGithubAuthenticatedUser(accessToken, logger, user.sub);

    const repos = await loadGithubRepositories(accessToken, logger, user.sub);
    cache.set(cacheKey, { repos, expiresAt: Date.now() + REPO_CACHE_TTL_MS });

    return repos;
  };

  const assertRepositoryReadAccess = async (
    request: FastifyRequest,
    repoFullName: string
  ): Promise<void> => {
    const allowed = await getAllowedRepositories(request);
    const normalized = repoFullName.toLowerCase();

    if (allowed.has(repoFullName) || allowed.has(normalized)) return;

    const userId = request.currentUser?.sub;
    const accessToken = userId ? resolveGithubAccessToken(request, userId) : null;

    if (accessToken && userId) {
      const hasDirectAccess = await hasGithubRepositoryAccess(
        accessToken,
        logger,
        userId,
        repoFullName
      );
      if (hasDirectAccess) {
        allowed.add(repoFullName);
        allowed.add(normalized);
        return;
      }
    }

    throw new ForbiddenError('No access to this repository');
  };

  const assertAdministrationAccess = async (request: FastifyRequest): Promise<void> => {
    const user = request.currentUser;
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!user.roles.includes('admin')) {
      throw new ForbiddenError('Administration access required');
    }
  };

  const authorize = async <T extends TypedAuthorizationRequest>(
    request: FastifyRequest,
    input: T
  ): Promise<AuthorizationResultFor<T>> => {
    const { action, resource } = input;

    if (action === 'repositories:list') {
      const allowedRepositories = await getAllowedRepositories(request);
      return { allowedRepositories } as AuthorizationResultFor<T>;
    }

    if (action === 'repository:read') {
      await assertRepositoryReadAccess(request, resource.fullName);
      return {} as AuthorizationResultFor<T>;
    }

    if (action === 'administration:read' || action === 'administration:write') {
      await assertAdministrationAccess(request);
      return {} as AuthorizationResultFor<T>;
    }

    throw new ForbiddenError('Invalid authorization action');
  };

  return { authorize };
}
