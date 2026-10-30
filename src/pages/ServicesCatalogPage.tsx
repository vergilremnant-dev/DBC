import { Link, useSearchParams } from 'react-router-dom';
import { useServiceCatalog, WORKFORCE_GROUPS } from '../hooks/marketplace/useServiceCatalog';
import { ServiceGrid } from '../components/marketplace/ServiceDirectory';
import { ServiceSearch } from '../components/marketplace/ServiceSearch';

/** /services — the complete catalog, both workforce groups in backend display order. */
export function ServicesCatalogPage() {
  const [params] = useSearchParams();
  const city = params.get('city') || '';
  const { groups, categories, status } = useServiceCatalog();

  return (
    <div className="dbc-container space-y-8 py-6 sm:py-10">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="text-sm text-stone-600">
          <Link to="/" className="hover:text-stone-900 hover:underline">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page" className="font-medium text-stone-900">Services</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-display sm:text-3xl">All services</h1>
            <p className="mt-1 text-sm text-stone-600">
              {status === 'ready' ? `${categories.length} services across design, consultancy and construction trades.` : 'Design, consultancy and construction trades.'}
            </p>
          </div>
          <ServiceSearch city={city} catalog={categories} className="lg:max-w-md" />
        </div>
        <nav aria-label="Jump to group" className="flex flex-wrap gap-2">
          {WORKFORCE_GROUPS.map((g) => (
            <a key={g.type} href={`#${g.type.toLowerCase()}`} className="inline-flex min-h-[40px] items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 hover:border-emerald-700/40">
              {g.label}
            </a>
          ))}
        </nav>
      </header>

      {status === 'error' && (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-700" role="alert">
          We couldn't load services right now. Please refresh the page.
        </p>
      )}

      {status !== 'error' &&
        WORKFORCE_GROUPS.map((g) => (
          <section key={g.type} id={g.type.toLowerCase()} aria-labelledby={`${g.type}-h`} className="scroll-mt-24 space-y-4">
            <div>
              <h2 id={`${g.type}-h`} className="text-lg font-bold text-stone-900 font-display sm:text-xl">
                {g.label}
                {status === 'ready' && <span className="ml-2 text-sm font-medium text-stone-600">{groups[g.type].length}</span>}
              </h2>
              <p className="text-sm text-stone-600">{g.description}</p>
            </div>
            <ServiceGrid services={groups[g.type]} city={city} loading={status === 'loading'} />
          </section>
        ))}
    </div>
  );
}
