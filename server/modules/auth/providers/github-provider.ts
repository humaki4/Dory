import { BadRequestError } from '../../../core/errors';
import { getProviderConfig } from '../config';
import { OAuthIdentity } from '../types';
import { CodeExchangeInput, OAuthProviderAdapter } from './provider';

function getGithubScope(): string {
  return process.env.AUTH_GITHUB_SCOPES || 'read:user user:email read:org repo';
}

async function exchangeGithubCodeForToken(input: CodeExchangeInput): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: input.code,
      state: input.state,
      client_id: input.config.clientId,
      client_secret: input.config.clientSecret,
      redirect_uri: input.config.callbackUrl,
    }),
  });

  if (!response.ok) {
    throw new BadRequestError('GitHub OAuth token exchange failed');
  }

  const payload = (await response.json()) as { access_token?: string; error?: string };

  if (!payload.access_token) {
    throw new BadRequestError(payload.error || 'GitHub OAuth token missing');
  }

  return payload.access_token;
}

async function loadGithubIdentity(accessToken: string): Promise<OAuthIdentity> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'docAtlas-auth',
  };

  const userResponse = await fetch('https://api.github.com/user', { headers });
  if (!userResponse.ok) {
    throw new BadRequestError('Failed to fetch GitHub user profile');
  }

  const userPayload = (await userResponse.json()) as {
    id: number;
    login: string;
    name?: string;
  };

  const orgResponse = await fetch('https://api.github.com/user/orgs?per_page=100', { headers });
  const orgPayload = orgResponse.ok
    ? ((await orgResponse.json()) as Array<{ login: string }>).map((org) => org.login)
    : [];

  const teamResponse = await fetch('https://api.github.com/user/teams?per_page=100', { headers });
  const teamPayload = teamResponse.ok
    ? (
        (await teamResponse.json()) as Array<{
          slug: string;
          organization: { login: string };
        }>
      ).map((team) => `${team.organization.login}/${team.slug}`)
    : [];

  return {
    sub: String(userPayload.id),
    username: userPayload.login,
    displayName: userPayload.name,
    orgs: orgPayload,
    teams: teamPayload,
  };
}

export const githubProviderAdapter: OAuthProviderAdapter = {
  provider: 'github',
  buildAuthorizationUrl(state: string): string {
    const { clientId, callbackUrl } = getProviderConfig('github');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: getGithubScope(),
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
  exchangeCodeForToken: exchangeGithubCodeForToken,
  loadIdentity: loadGithubIdentity,
};
