import { SupportedProvider } from '../types';
import { githubProviderAdapter } from './github-provider';
import { gitlabProviderAdapter } from './gitlab-provider';
import { OAuthProviderAdapter } from './provider';

const providerAdapters: Record<SupportedProvider, OAuthProviderAdapter> = {
  github: githubProviderAdapter,
  gitlab: gitlabProviderAdapter,
};

export function getProviderAdapter(provider: SupportedProvider): OAuthProviderAdapter {
  return providerAdapters[provider];
}
