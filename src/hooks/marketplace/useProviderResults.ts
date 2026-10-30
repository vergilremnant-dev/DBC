import { useCallback, useEffect, useRef, useState } from 'react';
import { searchApi } from '../../services/search/searchService';
import type { ProviderSearchParams } from '../../types/search/searchTypes';
import type { ProviderProfile } from '../../types/provider/providerTypes';

/**
 * Professionals from GET /api/search/providers with cursor-based "Load more".
 * Pass `enabled: false` until required params (e.g. categoryId) are known.
 */
export function useProviderResults(params: ProviderSearchParams, enabled = true) {
  const [items, setItems] = useState<ProviderProfile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const key = JSON.stringify(params);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(enabled ? 'loading' : 'idle');
  const [loadingMore, setLoadingMore] = useState(false);
  const latest = useRef(key);

  // New filters: reset during render (React's recommended alternative to setState in an effect).
  const requestId = `${enabled}:${key}`;
  const [activeRequest, setActiveRequest] = useState(requestId);
  if (activeRequest !== requestId) {
    setActiveRequest(requestId);
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setStatus(enabled ? 'loading' : 'idle');
  }

  useEffect(() => {
    latest.current = key;
    if (!enabled) return;
    searchApi
      .searchProviders(params)
      .then((res) => {
        if (latest.current !== key) return;
        setItems(res.data || []);
        setCursor(res.nextCursor);
        setHasMore(!!res.hasMore && !!res.nextCursor);
        setStatus('ready');
      })
      .catch(() => latest.current === key && setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const requestKey = key;
    searchApi
      .searchProviders({ ...params, cursor })
      .then((res) => {
        if (latest.current !== requestKey) return;
        // De-duplicate by id in case the underlying data changed between pages.
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...(res.data || []).filter((p) => !seen.has(p.id))];
        });
        setCursor(res.nextCursor);
        setHasMore(!!res.hasMore && !!res.nextCursor);
      })
      .catch(() => setHasMore(true))
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, loadingMore, key]);

  return { items, status, hasMore, loadMore, loadingMore };
}
