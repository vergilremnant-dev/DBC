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

const FORBIDDEN_CACHE_SECURITY_KEYS = [
  'access_token',
  'refresh_token',
  'password',
  'otp',
  'creditcard',
  'card',
  'cvv',
  'bank',
  'account_number',
  'iban',
  'secret',
];

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
   * Checks whether a cache entry exists and is fresh (within TTL window).
   */
  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return !this.isExpired(entry);
  }

  /**
   * Checks whether a cache entry is stale or missing.
   */
  isStale(key: string): boolean {
    return !this.isFresh(key);
  }

  /**
   * Stores value in cache with specified TTL and category.
   */
  set<T>(key: string, data: T, ttlMs?: number, category: CacheEntry['category'] = 'GENERAL'): void {
    // Security check: Never allow tokens, passwords, OTPs, or financial secrets in generic cache
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_CACHE_SECURITY_KEYS.some((secKey) => lowerKey.includes(secKey))) {
      this.cache.delete(key);
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
   * Invalidates specific cache key.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates all cache entries matching a prefix (e.g. 'quotation_').
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all items from cache.
   */
  clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Coalesces duplicate in-flight GET requests.
   */
  async deduplicateRequest<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetchFn();
        this.set(key, data);
        return data;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttlMs;
  }
}

export const mobileCache = new MobileCacheController();
