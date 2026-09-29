import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function maskValue(value: string | undefined): string {
  if (!value) {
    return 'missing';
  }

  if (value.length <= 6) {
    return `${value.slice(0, 1)}***`;
  }

  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function loadEnvironmentFiles() {
  const candidates = ['.env', '.env.local', '../.env', '../.env.local'];
  const loaded: string[] = [];

  for (const candidate of candidates) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(resolved)) {
      continue;
    }

    dotenv.config({ path: resolved, override: true });
    loaded.push(resolved);
  }

  const hasGithubClientId = Boolean(process.env.AUTH_GITHUB_CLIENT_ID);
  const hasGithubClientSecret = Boolean(process.env.AUTH_GITHUB_CLIENT_SECRET);
  const hasGitlabClientId = Boolean(process.env.AUTH_GITLAB_CLIENT_ID);
  const hasGitlabClientSecret = Boolean(process.env.AUTH_GITLAB_CLIENT_SECRET);
  const gitlabEnabled =
    (process.env.AUTH_GITLAB_ENABLED || '').trim().toLowerCase() === '1' ||
    (process.env.AUTH_GITLAB_ENABLED || '').trim().toLowerCase() === 'true' ||
    (process.env.AUTH_GITLAB_ENABLED || '').trim().toLowerCase() === 'yes' ||
    (process.env.AUTH_GITLAB_ENABLED || '').trim().toLowerCase() === 'on';

  console.info(
    {
      loadedEnvFiles: loaded,
      hasGithubClientId,
      hasGithubClientSecret,
      effectiveGithubClientId: maskValue(process.env.AUTH_GITHUB_CLIENT_ID),
      gitlabEnabled,
      gitlabBaseUrl: process.env.AUTH_GITLAB_BASE_URL || 'https://gitlab.com',
      hasGitlabClientId,
      hasGitlabClientSecret,
      effectiveGitlabClientId: maskValue(process.env.AUTH_GITLAB_CLIENT_ID),
    },
    'server: environment initialized'
  );

  if (gitlabEnabled && (!hasGitlabClientId || !hasGitlabClientSecret)) {
    console.warn(
      'server: AUTH_GITLAB_ENABLED is true but AUTH_GITLAB_CLIENT_ID/SECRET are missing'
    );
  }
}

loadEnvironmentFiles();

import buildApp from './app';

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;

// Start server
const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
