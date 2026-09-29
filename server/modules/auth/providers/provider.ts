import { SupportedProvider, OAuthIdentity } from '../types';

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface CodeExchangeInput {
  code: string;
  state: string;
  config: ProviderConfig;
}

export interface OAuthProviderAdapter {
  readonly provider: SupportedProvider;
  buildAuthorizationUrl(state: string): string;
  exchangeCodeForToken?(input: CodeExchangeInput): Promise<string>;
  loadIdentity?(accessToken: string): Promise<OAuthIdentity>;
}
