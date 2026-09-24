/**
 * DBC Mobile Lightweight Cache & Request Deduplication Controller.
 * Implements key-based memory caching with TTL, invalidation by prefix, stale detection,
 * and request deduplication for concurrent GET calls.
 */

import type { CacheEntry, CachePolicyOptions } from './cacheTypes.js';

export const DEFAULT_CACHE_TTL = {
  MARKETPLACE: 5 * 60 * 1000, // 5 minutes
  WORKSPACE: 60 * 1000,        // 1 minute
  FINANCIAL: 30 * 1000,        // 30 seconds
  MESSAGING: 15 * 1000,        // 15 seconds
  GENERAL: 2 * 60 * 1000,      // 2 minutes
};

class MobileCacheController {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlightRequests = new Map<string, Promise<any>>();

  /**
   * Retrieves item from cache if present and not expired beyond TTL.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Returns cache entry metadata (including timestamp and TTL).
   */
  getEntry<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry as CacheEntry<T>;
  }

  /**
   * Stores value in cache with specified TTL and category.
   */
  set<T>(key: string, data: T, ttlMs?: number, category: CacheEntry['category'] = 'GENERAL'): void {
    // Security check: Never allow tokens or auth credentials in generic cache
    if (key.includes('access_token') || key.includes('refresh_token') || key.includes('password') || key.includes('otp')) {
      return;
    }

    const defaultTTL = DEFAULT_CACHE_TTL[category] || DEFAULT_CACHE_TTL.GENERAL;
    const finalTTL = ttlMs ?? defaultTTL;

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttlMs: finalTTL,
      category,
    });
  }

  /**
   * Checks whether a cached entry exists and is within its fresh TTL limit.
   */
  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return !this.isExpired(entry);
  }

  /**
   * Checks whether an entry exists but is older than half its TTL (stale but valid for revalidation).
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    const age = Date.now() - entry.timestamp;
    return age > entry.ttlMs / 2;
  }

  /**
   * Invalidates a single specific cache key.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates all cache entries matching a prefix string.
   */
  invalidatePrefix(prefix: string): void {
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clears all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Request Deduplication: Shares in-flight Promises for identical concurrent GET requests.
   */
  async deduplicateRequest<T>(requestKey: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey) as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await requestFn();
      } finally {
        this.inFlightRequests.delete(requestKey);
      }
    })();

    this.inFlightRequests.set(requestKey, promise);
    return promise;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttlMs;
  }
}

export const mobileCache = new MobileCacheController();
