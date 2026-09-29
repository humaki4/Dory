import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';

import { IVcsProvider } from './IVcsProvider';
import { GitHubProvider } from './implementations/github/github';
import { GitLabProvider } from './implementations/gitlab/gitlab';

declare module 'fastify' {
  interface FastifyInstance {
    vcsProvider: IVcsProvider;
  }
}

const vcsProviderPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  const providerType = process.env.PROVIDER_TYPE || 'github';

  // if (providerType !== 'github') {
  //   done(new Error(`Unsupported VCS provider: ${providerType}`));
  //   return;
  // }

  if (providerType === 'github') {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      done(new Error('GITHUB_TOKEN is required for github provider'));
      return;
    }

    const vcsProvider = new GitHubProvider(githubToken);
    fastify.decorate('vcsProvider', vcsProvider);
    done();
  } else if (providerType === 'gitlab') {
    const gitlabToken = process.env.GITLAB_TOKEN;
    if (!gitlabToken) {
      done(new Error('GITLAB_TOKEN is required for gitlab provider'));
      return;
    }

    const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
    const vcsProvider = new GitLabProvider(gitlabToken, gitlabBaseUrl);
    fastify.decorate('vcsProvider', vcsProvider);
    done();
  } else {
    done(new Error(`Unsupported VCS provider: ${providerType}`));
  }
};

export default fp(vcsProviderPlugin);
