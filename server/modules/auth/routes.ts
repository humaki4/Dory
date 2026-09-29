import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  getActiveAuthProvider,
  getBackendBaseUrl,
  getClientRedirectUrl,
  getGitlabBaseUrl,
  isGitlabAuthEnabled,
} from './config';
import { mapWhoAmI } from './mapping';
import {
  completeOAuthCallback,
  createAuthorizationUrl,
  resolveProvider,
} from './oauth-flow-service';
import { clearSessionCookies, createSessionToken, setSessionCookies } from './session';

export default function (fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const providerParamsSchema = z.object({
    provider: z.string().min(1),
  });

  app.get('/provider', async () => {
    const provider = getActiveAuthProvider();
    return {
      provider,
      loginPath: `/api/auth/${provider}/start`,
    };
  });

  app.get(
    '/:provider/start',
    {
      schema: {
        params: providerParamsSchema,
      },
    },
    async (request, reply) => {
      fastify.log.info(
        {
          path: request.url,
          providerParam: request.params.provider,
          backendBaseUrl: getBackendBaseUrl(),
          clientRedirectUrl: getClientRedirectUrl(),
          hasGithubClientId: Boolean(process.env.AUTH_GITHUB_CLIENT_ID),
          hasGithubClientSecret: Boolean(process.env.AUTH_GITHUB_CLIENT_SECRET),
          gitlabEnabled: isGitlabAuthEnabled(),
          gitlabBaseUrl: getGitlabBaseUrl(),
          hasGitlabClientId: Boolean(process.env.AUTH_GITLAB_CLIENT_ID),
          hasGitlabClientSecret: Boolean(process.env.AUTH_GITLAB_CLIENT_SECRET),
        },
        'auth: oauth start requested'
      );

      const provider = resolveProvider(request.params.provider);
      const { state, url } = createAuthorizationUrl(provider);

      fastify.log.info(
        {
          provider,
          stateLength: state.length,
          authorizationUrl: url,
        },
        'auth: redirecting to oauth provider authorize url'
      );
      return reply.redirect(url);
    }
  );

  app.get(
    '/:provider/callback',
    {
      schema: {
        params: providerParamsSchema,
        querystring: z.object({
          code: z.string().optional(),
          state: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      fastify.log.info(
        {
          path: request.url,
          providerParam: request.params.provider,
          hasCode: Boolean(request.query.code),
          hasState: Boolean(request.query.state),
        },
        'auth: oauth callback requested'
      );

      const provider = resolveProvider(request.params.provider);

      const { user, accessToken } = await completeOAuthCallback({
        provider,
        code: request.query.code,
        state: request.query.state,
      });

      const token = await createSessionToken(reply, user);

      if (provider === 'gitlab') {
        fastify.setGitlabAccessToken(user.sub, accessToken);
      } else {
        fastify.setGithubAccessToken(user.sub, accessToken);
      }
      setSessionCookies(reply, token, provider, accessToken);

      fastify.log.info(
        { userId: user.sub, provider, username: user.username, roles: user.roles },
        'auth: oauth login successful'
      );

      return reply.redirect(getClientRedirectUrl());
    }
  );

  app.get('/whoami', async (request) => {
    const user = await fastify.getCurrentUser(request);
    fastify.log.debug(
      {
        path: request.url,
        authenticated: Boolean(user),
        userId: user?.sub,
        username: user?.username,
      },
      'auth: whoami requested'
    );
    return mapWhoAmI(user);
  });

  app.post('/logout', async (request, reply) => {
    const currentUser = request.currentUser;
    if (currentUser?.provider === 'github') {
      fastify.clearGithubAccessToken(currentUser.sub);
    } else if (currentUser?.provider === 'gitlab') {
      fastify.clearGitlabAccessToken(currentUser.sub);
    }

    clearSessionCookies(reply);

    fastify.log.info(
      { userId: currentUser?.sub, provider: currentUser?.provider },
      'auth: user logged out'
    );

    return {
      success: true,
    };
  });
}
