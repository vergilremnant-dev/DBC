/**
 * DBC Mobile Cache Architecture Types.
 * Defines structure for key-based in-memory caching, TTL policies, and stale-while-revalidate states.
 */

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttlMs: number;
  category: 'MARKETPLACE' | 'WORKSPACE' | 'FINANCIAL' | 'MESSAGING' | 'GENERAL';
}

export type NetworkStatusState = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export interface CachePolicyOptions {
  ttlMs?: number;
  category?: CacheEntry['category'];
  staleWhileRevalidate?: boolean;
}
