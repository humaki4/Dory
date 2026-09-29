import { FastifyBaseLogger } from 'fastify';
import { ForbiddenError } from '../../core/errors';
import { GithubAuthenticatedUser } from './types';

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'docAtlas-authz',
  };
}

export async function loadGithubRepositories(
  token: string,
  logger: FastifyBaseLogger,
  userId: string
): Promise<Set<string>> {
  const repos = new Set<string>();
  let page = 1;

  logger.info({ userId }, 'authz: loading github repositories started');

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      { headers: githubHeaders(token) }
    );

    if (!response.ok) {
      const responseBody = await response.text();
      logger.error(
        { userId, page, statusCode: response.status, responseBody },
        'authz: github repositories request failed'
      );
      throw new ForbiddenError('Unable to verify GitHub repository permissions');
    }

    const payload = (await response.json()) as Array<{ full_name?: string }>;
    for (const repo of payload) {
      if (typeof repo.full_name === 'string' && repo.full_name.length > 0) {
        repos.add(repo.full_name);
        repos.add(repo.full_name.toLowerCase());
      }
    }

    if (payload.length < 100) break;
    page += 1;
  }

  logger.info(
    { userId, totalKnownRepositoryKeys: repos.size },
    'authz: loading github repositories completed'
  );
  return repos;
}

export async function loadGithubAuthenticatedUser(
  token: string,
  logger: FastifyBaseLogger,
  userId: string
): Promise<GithubAuthenticatedUser | null> {
  const response = await fetch('https://api.github.com/user', { headers: githubHeaders(token) });

  if (!response.ok) {
    const responseBody = await response.text();
    logger.warn(
      { userId, statusCode: response.status, responseBody },
      'authz: failed to resolve github authenticated user'
    );
    return null;
  }

  const payload = (await response.json()) as GithubAuthenticatedUser;
  logger.info(
    { userId, githubLogin: payload.login, githubId: payload.id, githubName: payload.name },
    'authz: github authenticated user resolved'
  );
  return payload;
}

export async function hasGithubRepositoryAccess(
  token: string,
  logger: FastifyBaseLogger,
  userId: string,
  repoFullName: string
): Promise<boolean> {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: githubHeaders(token),
  });

  if (response.ok) return true;

  const responseBody = await response.text();
  logger.warn(
    { userId, repoFullName, statusCode: response.status, responseBody },
    'authz: direct github repository access check failed'
  );
  return false;
}
