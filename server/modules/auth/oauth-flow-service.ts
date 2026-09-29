import { BadRequestError } from '../../core/errors';
import { AuthTokenClaims } from '../../plugins/auth/auth';
import { assertProviderEnabled, getProviderConfig } from './config';
import { resolveRoles } from './mapping';
import { consumeOAuthState, createOAuthState } from './oauth-state-store';
import { getProviderAdapter } from './providers';
import { SupportedProvider } from './types';

export function resolveProvider(providerParam: string | undefined): SupportedProvider {
  const provider = providerParam?.toLowerCase();

  if (provider === 'github' || provider === 'gitlab') {
    return provider;
  }

  throw new BadRequestError('Unsupported provider');
}

export function createAuthorizationUrl(provider: SupportedProvider): {
  state: string;
  url: string;
} {
  assertProviderEnabled(provider);

  const state = createOAuthState(provider);
  const adapter = getProviderAdapter(provider);

  return {
    state,
    url: adapter.buildAuthorizationUrl(state),
  };
}

export async function completeOAuthCallback(input: {
  provider: SupportedProvider;
  code?: string;
  state?: string;
}): Promise<{ user: AuthTokenClaims; accessToken: string }> {
  const { provider, code, state } = input;

  assertProviderEnabled(provider);

  if (!code || !state) {
    throw new BadRequestError('Missing OAuth callback parameters');
  }

  const storedState = consumeOAuthState(state);
  if (!storedState || storedState.provider !== provider || storedState.expiresAt < Date.now()) {
    throw new BadRequestError('Invalid OAuth state');
  }

  const adapter = getProviderAdapter(provider);
  if (!adapter.exchangeCodeForToken || !adapter.loadIdentity) {
    throw new BadRequestError(`OAuth callback for ${provider} is not implemented`);
  }

  const config = getProviderConfig(provider);
  const accessToken = await adapter.exchangeCodeForToken({
    code,
    state,
    config,
  });

  const identity = await adapter.loadIdentity(accessToken);

  const user: AuthTokenClaims = {
    sub: identity.sub,
    provider,
    username: identity.username,
    displayName: identity.displayName,
    orgs: identity.orgs,
    teams: identity.teams,
    roles: resolveRoles(identity),
  };

  return {
    user,
    accessToken,
  };
}
