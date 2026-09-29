export interface AuthPluginConfig {
  authSecret: string;
  sessionCookieName: string;
  githubAccessCookieName: string;
  githubTokenCacheTtlMs: number;
  gitlabAccessCookieName: string;
  gitlabTokenCacheTtlMs: number;
}

export const authConfig: AuthPluginConfig = {
  authSecret: process.env.AUTH_JWT_SECRET || 'docatlas-dev-secret-change-me',
  sessionCookieName: process.env.AUTH_SESSION_COOKIE_NAME || 'docatlas_session',
  githubAccessCookieName: process.env.AUTH_GITHUB_ACCESS_COOKIE_NAME || 'docatlas_github_access',
  githubTokenCacheTtlMs: Number(process.env.AUTH_GITHUB_TOKEN_CACHE_TTL_MS || 8 * 60 * 60 * 1000),
  gitlabAccessCookieName: process.env.AUTH_GITLAB_ACCESS_COOKIE_NAME || 'docatlas_gitlab_access',
  gitlabTokenCacheTtlMs: Number(process.env.AUTH_GITLAB_TOKEN_CACHE_TTL_MS || 8 * 60 * 60 * 1000),
};
