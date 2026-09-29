import { BadRequestError } from '../../../core/errors';
import { getGitlabBaseUrl, getProviderConfig } from '../config';
import { OAuthIdentity } from '../types';
import { CodeExchangeInput, OAuthProviderAdapter } from './provider';

function getGitlabScope(): string {
  const rawScope = process.env.AUTH_GITLAB_SCOPES || 'read_user api';
  return rawScope;
}

async function exchangeGitlabCodeForToken(input: CodeExchangeInput): Promise<string> {
  const baseUrl = getGitlabBaseUrl();
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.config.callbackUrl,
      client_id: input.config.clientId,
      client_secret: input.config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new BadRequestError('GitLab OAuth token exchange failed');
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!payload.access_token) {
    throw new BadRequestError(
      payload.error_description || payload.error || 'GitLab OAuth token missing'
    );
  }

  return payload.access_token;
}

async function loadGitlabIdentity(accessToken: string): Promise<OAuthIdentity> {
  const baseUrl = getGitlabBaseUrl();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'User-Agent': 'docAtlas-auth',
  };

  const userResponse = await fetch(`${baseUrl}/api/v4/user`, { headers });
  if (!userResponse.ok) {
    throw new BadRequestError('Failed to fetch GitLab user profile');
  }

  const userPayload = (await userResponse.json()) as {
    id: number;
    username: string;
    name?: string;
  };

  const groupsResponse = await fetch(`${baseUrl}/api/v4/groups?per_page=100`, { headers });
  const orgs = groupsResponse.ok
    ? ((await groupsResponse.json()) as Array<{ full_path?: string; path?: string }>)
        .map((group) => group.full_path || group.path)
        .filter((value): value is string => Boolean(value))
    : [];

  return {
    sub: String(userPayload.id),
    username: userPayload.username,
    displayName: userPayload.name,
    orgs,
    teams: [],
  };
}

export const gitlabProviderAdapter: OAuthProviderAdapter = {
  provider: 'gitlab',
  buildAuthorizationUrl(state: string): string {
    const { clientId, callbackUrl } = getProviderConfig('gitlab');
    const baseUrl = getGitlabBaseUrl();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: getGitlabScope(),
      state,
    });

    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  },
  exchangeCodeForToken: exchangeGitlabCodeForToken,
  loadIdentity: loadGitlabIdentity,
};
