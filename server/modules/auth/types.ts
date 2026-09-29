import { AuthTokenClaims } from '../../plugins/auth/auth';

export type SupportedProvider = 'github' | 'gitlab';

export interface OAuthState {
  provider: SupportedProvider;
  expiresAt: number;
}

export interface OAuthIdentity {
  sub: string;
  username: string;
  displayName?: string;
  orgs: string[];
  teams: string[];
}

export interface WhoAmIResponse {
  authenticated: boolean;
  user: AuthTokenClaims | null;
  permissions: {
    administration: boolean;
  };
}
