export type CachedGithubToken = {
  token: string;
  expiresAt: number;
};

export interface GithubTokenCache {
  set: (userId: string, token: string) => void;
  get: (userId: string) => string | null;
  clear: (userId: string) => void;
}

export function createGithubTokenCache(ttlMs: number): GithubTokenCache {
  const store = new Map<string, CachedGithubToken>();

  const cleanupExpired = () => {
    const now = Date.now();
    for (const [userId, value] of store.entries()) {
      if (value.expiresAt <= now) {
        store.delete(userId);
      }
    }
  };

  return {
    set(userId: string, token: string) {
      cleanupExpired();
      store.set(userId, {
        token,
        expiresAt: Date.now() + ttlMs,
      });
    },
    get(userId: string) {
      cleanupExpired();
      const value = store.get(userId);
      return value ? value.token : null;
    },
    clear(userId: string) {
      store.delete(userId);
    },
  };
}
