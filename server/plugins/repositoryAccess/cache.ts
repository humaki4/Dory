import { RepositoryAccessCacheEntry } from './types';

export function createRepositoryAccessCache() {
  const cache = new Map<string, RepositoryAccessCacheEntry>();

  const cleanupExpired = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (value.expiresAt <= now) cache.delete(key);
    }
  };

  const get = (key: string) => {
    cleanupExpired();
    return cache.get(key);
  };

  const set = (key: string, value: RepositoryAccessCacheEntry) => {
    cache.set(key, value);
  };

  return { get, set };
}
