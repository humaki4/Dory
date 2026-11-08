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
type LoadPublicRepositories = () => Promise<Set<string>>;

export type RepositoryAccessService = {
  authorize: <T extends TypedAuthorizationRequest>(
    request: FastifyRequest,
    input: T
  ) => Promise<AuthorizationResultFor<T>>;
};

export function createRepositoryAccessService(
  logger: FastifyBaseLogger,
  resolveGithubAccessToken: ResolveGithubAccessToken,
  loadPublicRepositories: LoadPublicRepositories = async () => new Set()
): RepositoryAccessService {
  const cache = createRepositoryAccessCache();

  const getAllowedRepositories = async (request: FastifyRequest): Promise<Set<string>> => {
    const user = request.currentUser;
    if (!user) throw new UnauthorizedError('Authentication required');

    const publicRepositories = await loadPublicRepositories();
    const allowed = new Set<string>();
    for (const repository of publicRepositories) {
      allowed.add(repository);
      allowed.add(repository.toLowerCase());
    }

    if (user.provider !== 'github') return allowed;

    const cacheKey = `${user.provider}:${user.sub}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      for (const repository of cached.repos) allowed.add(repository);
      return allowed;
    }

    const accessToken = resolveGithubAccessToken(request, user.sub);
    if (!accessToken) return allowed;

    try {
      await loadGithubAuthenticatedUser(accessToken, logger, user.sub);

      const repos = await loadGithubRepositories(accessToken, logger, user.sub);
      cache.set(cacheKey, { repos, expiresAt: Date.now() + REPO_CACHE_TTL_MS });
      for (const repository of repos) allowed.add(repository);
    } catch (error) {
      logger.warn(
        { userId: user.sub, error },
        'authz: falling back to registered public repositories'
      );
    }

    return allowed;
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
