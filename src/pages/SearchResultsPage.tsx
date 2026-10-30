import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApi } from '../services/search/searchService';
import type { SearchSuggestions } from '../types/search/searchTypes';
import { useServiceCatalog, WORKFORCE_GROUPS, isWorkforce } from '../hooks/marketplace/useServiceCatalog';
import { useProviderResults } from '../hooks/marketplace/useProviderResults';
import { ServiceSearch } from '../components/marketplace/ServiceSearch';
import { CitySelect } from '../components/marketplace/CitySelect';
import { ServiceIcon } from '../components/marketplace/ServiceIcon';
import { ProfessionalResultCard } from '../components/marketplace/ProfessionalResultCard';

const PAGE_SIZE = 12;

/**
 * /search — professionals matching ?q (services via the backend resolver, plus names),
 * combined with ?workforce, ?service (slug) and ?city filters. All state lives in the URL.
 */
export function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const { categories, groups, bySlug, status: catalogStatus } = useServiceCatalog();

  const q = (params.get('q') || '').trim();
  const city = params.get('city') || '';
  const wfParam = params.get('workforce');
  const workforce = isWorkforce(wfParam) ? wfParam : undefined;
  const serviceSlug = params.get('service') || '';
  const service = serviceSlug ? bySlug.get(serviceSlug) : undefined;
  const serviceIgnored = !!serviceSlug && catalogStatus === 'ready' && !service;

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // Services the query resolves to (same backend resolver as search), shown as shortcuts.
  const [matchState, setMatchState] = useState<{ q: string; categories: SearchSuggestions['categories'] }>({ q: '', categories: [] });
  useEffect(() => {
    if (q.length < 2) return;
    const ctrl = new AbortController();
    searchApi.getSuggestions(q, ctrl.signal).then((s) => setMatchState({ q, categories: s.categories })).catch(() => {});
    return () => ctrl.abort();
  }, [q]);
  const matches = matchState.q === q ? matchState.categories : [];

  // Wait for the catalog when a service filter is present so we never search without it.
  const ready = !serviceSlug || catalogStatus !== 'loading';
  const results = useProviderResults(
    {
      search: q || undefined,
      city: city || undefined,
      workforce: service ? undefined : workforce,
      categoryId: service?.id,
      limit: PAGE_SIZE,
    },
    ready,
  );

  const serviceOptions = workforce ? groups[workforce] : categories;
  const hasFilters = !!(workforce || serviceSlug || city);
  const clearFilters = () => update({ workforce: undefined, service: undefined, city: undefined });

  const summary = [service?.name ?? (workforce ? WORKFORCE_GROUPS.find((g) => g.type === workforce)?.label : null), city ? `in ${city}` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="dbc-container space-y-5 py-5 sm:py-8">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900 font-display">{q ? <>Results for “{q}”</> : 'Find professionals'}</h1>
        <ServiceSearch initialQuery={q} city={city} catalog={categories} />
      </header>

      {/* Filters */}
      <section aria-label="Filters" className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
        <div role="radiogroup" aria-label="Workforce" className="flex flex-wrap gap-2">
          {[{ type: undefined, label: 'All' }, ...WORKFORCE_GROUPS].map((g) => {
            const on = workforce === g.type;
            return (
              <button
                key={g.label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  const keepService = service && (!g.type || service.categoryType === g.type);
                  update({ workforce: g.type, service: keepService ? serviceSlug : undefined });
                }}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  on ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="relative">
            <label htmlFor="search-service" className="sr-only">Service</label>
            <select
              id="search-service"
              value={service ? serviceSlug : ''}
              onChange={(e) => {
                const next = bySlug.get(e.target.value);
                update({ service: e.target.value || undefined, workforce: next ? next.categoryType : workforce });
              }}
              disabled={catalogStatus !== 'ready'}
              className="min-h-[48px] w-full cursor-pointer appearance-none rounded-2xl border border-stone-300 bg-white pl-4 pr-9 text-base text-stone-900 shadow-xs transition hover:border-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
            >
              <option value="">{workforce ? `All ${WORKFORCE_GROUPS.find((g) => g.type === workforce)?.label} services` : 'All services'}</option>
              {WORKFORCE_GROUPS.filter((g) => !workforce || g.type === workforce).map((g) => (
                <optgroup key={g.type} label={g.label}>
                  {serviceOptions.filter((c) => c.categoryType === g.type).map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          <CitySelect id="search-city" value={city} onChange={(c) => update({ city: c || undefined })} />
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="dbc-btn dbc-btn-ghost min-h-[48px]">
              Clear filters
            </button>
          )}
        </div>
        {serviceIgnored && <p className="text-xs text-stone-600" role="status">That service is no longer offered, so it isn't applied.</p>}
      </section>

      {/* Matching services */}
      {matches.length > 0 && !service && (
        <section aria-label="Matching services" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-stone-600">Matching services:</span>
          {matches.map((m) => (
            <Link
              key={m.slug}
              to={`/services/${m.slug}${city ? `?city=${encodeURIComponent(city)}` : ''}`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-emerald-700/30 bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <ServiceIcon slug={m.slug} className="h-4 w-4" />
              {m.name}
            </Link>
          ))}
        </section>
      )}

      {/* Results */}
      <section aria-labelledby="search-results-h" className="space-y-4">
        <h2 id="search-results-h" className="text-base font-semibold text-stone-900" aria-live="polite">
          {results.status === 'ready'
            ? `${results.items.length}${results.hasMore ? '+' : ''} professional${results.items.length === 1 && !results.hasMore ? '' : 's'}${summary ? ` · ${summary}` : ''}`
            : 'Professionals'}
        </h2>

        {(results.status === 'loading' || results.status === 'idle') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-200/70" />)}
          </div>
        )}
        {results.status === 'error' && (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-700" role="alert">
            Search is unavailable right now. Please try again in a moment.
          </p>
        )}
        {results.status === 'ready' && results.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center sm:p-8">
            <p className="text-sm font-semibold text-stone-900">No professionals found{q ? ` for “${q}”` : ''}{summary ? ` · ${summary}` : ''}.</p>
            <p className="mt-1 text-sm text-stone-600">Try a different word (for example “plumber”, “leak” or “interior”), another city, or browse services.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {hasFilters && <button type="button" onClick={clearFilters} className="dbc-btn dbc-btn-secondary min-h-[44px]">Clear filters</button>}
              <Link to="/services" className="dbc-btn dbc-btn-secondary min-h-[44px]">Browse all services</Link>
            </div>
          </div>
        )}
        {results.items.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.items.map((p) => (
              <li key={p.id}>
                <ProfessionalResultCard provider={p} />
              </li>
            ))}
          </ul>
        )}
        {results.hasMore && (
          <div className="text-center">
            <button type="button" onClick={results.loadMore} disabled={results.loadingMore} className="dbc-btn dbc-btn-secondary min-h-[44px] px-6">
              {results.loadingMore ? 'Loading…' : 'Load more professionals'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
