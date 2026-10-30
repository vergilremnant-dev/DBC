import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { categoryApi } from '../services/category/categoryService';
import type { ServiceCategory } from '../types/category/categoryTypes';
import { useServiceCatalog, workforceLabel } from '../hooks/marketplace/useServiceCatalog';
import { useProviderResults } from '../hooks/marketplace/useProviderResults';
import { CitySelect } from '../components/marketplace/CitySelect';
import { ServiceIcon } from '../components/marketplace/ServiceIcon';
import { ProfessionalResultCard } from '../components/marketplace/ProfessionalResultCard';

const PAGE_SIZE = 12;

/** /services/:slug — professionals for one service, with city and keyword filters (URL-backed). */
export function ServiceProfessionalsPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const { bySlug, groups, status: catalogStatus } = useServiceCatalog();
  const category = bySlug.get(slug) ?? null;

  const city = params.get('city') || '';
  const q = params.get('q') || '';
  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    setDraft(q);
  }

  // Not in the active catalog: find out whether it is retired or unknown.
  const [retired, setRetired] = useState<ServiceCategory | null | undefined>(undefined);
  useEffect(() => {
    if (catalogStatus !== 'ready' || category) return;
    let alive = true;
    categoryApi
      .getCategory(slug)
      .then((c) => alive && setRetired(c ?? null))
      .catch(() => alive && setRetired(null));
    return () => {
      alive = false;
    };
  }, [catalogStatus, category, slug]);

  const results = useProviderResults(
    { categoryId: category?.id, city: city || undefined, search: q || undefined, limit: PAGE_SIZE },
    !!category,
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const cityQuery = city ? `?city=${encodeURIComponent(city)}` : '';

  if (catalogStatus === 'loading' || (catalogStatus === 'ready' && !category && retired === undefined)) {
    return (
      <div className="dbc-container py-10" role="status">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-stone-200/70" />
        <span className="sr-only">Loading service…</span>
      </div>
    );
  }

  if (!category) {
    const isRetired = !!retired && retired.isActive === false;
    return (
      <div className="dbc-container py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center sm:p-8">
          <h1 className="text-lg font-bold text-stone-900 font-display">{isRetired ? `${retired!.name} is no longer offered` : catalogStatus === 'error' ? 'Services unavailable' : 'Service not found'}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {isRetired
              ? 'This service has been retired from the DBC catalog. Browse the current services to find the right professional.'
              : catalogStatus === 'error'
                ? 'We could not load the service catalog. Please try again.'
                : 'We could not find that service.'}
          </p>
          <Link to={`/services${cityQuery}`} className="dbc-btn dbc-btn-primary mt-5 min-h-[44px]">Browse all services</Link>
        </div>
      </div>
    );
  }

  const related = groups[category.categoryType].filter((c) => c.id !== category.id);
  const group = workforceLabel(category.categoryType);

  return (
    <div className="dbc-container space-y-6 py-5 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-600">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" className="hover:text-stone-900 hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to={`/services${cityQuery}`} className="hover:text-stone-900 hover:underline">Services</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-stone-900">{category.name}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
            <ServiceIcon slug={category.slug} className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">{group}</p>
            <h1 className="text-2xl font-bold text-stone-900 font-display [overflow-wrap:anywhere]">{category.name}</h1>
            {category.description && <p className="mt-0.5 text-sm text-stone-600">{category.description}</p>}
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-[12rem_1fr] lg:max-w-lg">
          <CitySelect id="svc-city" value={city} onChange={(c) => setParam('city', c)} />
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setParam('q', draft.trim());
            }}
            className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-stone-300 bg-white pl-3.5 pr-1 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20"
          >
            <label htmlFor="svc-q" className="sr-only">Search {category.name} professionals by name</label>
            <input
              id="svc-q"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Name or business"
              className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-500 sm:text-sm"
            />
            <button type="submit" className="dbc-btn dbc-btn-primary h-10 shrink-0 px-4">Find</button>
          </form>
        </div>
      </header>

      <section aria-labelledby="svc-results" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="svc-results" className="text-base font-semibold text-stone-900">
            {results.status === 'ready'
              ? `${results.items.length}${results.hasMore ? '+' : ''} ${category.name} professional${results.items.length === 1 && !results.hasMore ? '' : 's'}${city ? ` in ${city}` : ''}`
              : `${category.name} professionals`}
          </h2>
          {(city || q) && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="min-h-[44px] rounded-lg px-2 text-sm font-semibold text-emerald-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {results.status === 'loading' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-200/70" />)}
          </div>
        )}
        {results.status === 'error' && (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-700" role="alert">
            We couldn't load professionals right now. Please try again.
          </p>
        )}
        {results.status === 'ready' && results.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center sm:p-8">
            <p className="text-sm font-semibold text-stone-900">
              No {category.name} professionals {q ? `matching “${q}”` : ''} {city ? `in ${city}` : ''} yet.
            </p>
            <p className="mt-1 text-sm text-stone-600">Try another city, or explore a related service.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(city || q) && (
                <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="dbc-btn dbc-btn-secondary min-h-[44px]">
                  Show all {category.name} professionals
                </button>
              )}
              <Link to={`/services${cityQuery}`} className="dbc-btn dbc-btn-secondary min-h-[44px]">Browse all services</Link>
            </div>
          </div>
        )}
        {results.items.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.items.map((p) => (
              <li key={p.id}>
                <ProfessionalResultCard provider={p} showService={false} />
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

      {related.length > 0 && (
        <section aria-labelledby="svc-related" className="space-y-3 border-t border-stone-200 pt-6">
          <h2 id="svc-related" className="text-base font-semibold text-stone-900">More in {group}</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/services/${c.slug}${cityQuery}`}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 text-sm text-stone-800 hover:border-emerald-700/40 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <ServiceIcon slug={c.slug} className="h-4 w-4 text-emerald-800" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
