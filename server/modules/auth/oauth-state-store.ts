import { randomBytes } from 'crypto';
import { STATE_TTL_MS } from './config';
import { OAuthState, SupportedProvider } from './types';

const oauthStates = new Map<string, OAuthState>();

function cleanupExpiredOAuthStates() {
  const now = Date.now();
  for (const [state, value] of oauthStates.entries()) {
    if (value.expiresAt <= now) {
      oauthStates.delete(state);
    }
  }
}

export function createOAuthState(provider: SupportedProvider): string {
  cleanupExpiredOAuthStates();

  const state = randomBytes(24).toString('hex');
  oauthStates.set(state, {
    provider,
    expiresAt: Date.now() + STATE_TTL_MS,
  });

  return state;
}

export function consumeOAuthState(state: string): OAuthState | null {
  cleanupExpiredOAuthStates();

  const storedState = oauthStates.get(state) || null;
  oauthStates.delete(state);
  return storedState;
}
