import { Link, useSearchParams } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import { ServiceSearch } from '../components/marketplace/ServiceSearch';
import { CitySelect } from '../components/marketplace/CitySelect';
import { ServiceGrid, WorkforceSwitch } from '../components/marketplace/ServiceDirectory';
import { ProfessionalResultCard } from '../components/marketplace/ProfessionalResultCard';
import { useServiceCatalog, WORKFORCE_GROUPS, isWorkforce, type Workforce } from '../hooks/marketplace/useServiceCatalog';
import { useProviderResults } from '../hooks/marketplace/useProviderResults';

const STEPS = [
  { title: 'Choose a service', text: 'Pick from design & consultancy or construction trades.' },
  { title: 'Compare professionals', text: 'Review profiles, experience and past work in your city.' },
  { title: 'Request quotes', text: 'Share your project scope and receive quotations before you commit.' },
];

export function PublicMarketplace() {
  const [params, setParams] = useSearchParams();
  const { setSelectedCity } = useNavigation();
  const { groups, categories, status } = useServiceCatalog();

  const selectedCity = params.get('city') || '';
  const wfParam = params.get('workforce');
  const workforce: Workforce = isWorkforce(wfParam) ? wfParam : 'WHITE_COLLAR';
  const group = WORKFORCE_GROUPS.find((g) => g.type === workforce)!;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const onCity = (city: string) => {
    setParam('city', city);
    if (city) setSelectedCity(city);
  };

  const pros = useProviderResults({ city: selectedCity || undefined, limit: 6 });
  const prosHref = `/search${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : ''}`;

  return (
    <div className="dbc-container space-y-10 py-6 sm:space-y-14 sm:py-10">
      {/* Search first */}
      <section aria-labelledby="mkt-title" className="mx-auto max-w-3xl text-center">
        <h1 id="mkt-title" className="text-2xl font-bold tracking-tight text-stone-900 font-display sm:text-4xl">
          Find the right professional for your construction project
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
          Architects, engineers and skilled trades — compare profiles and request quotes.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 text-left sm:flex-row">
          <CitySelect value={selectedCity} onChange={onCity} id="mkt-city" className="sm:w-48 sm:shrink-0" />
          <ServiceSearch size="lg" city={selectedCity} catalog={categories} className="sm:flex-1" />
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="mkt-services" className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="mkt-services" className="text-xl font-bold text-stone-900 font-display sm:text-2xl">Explore services</h2>
            <p className="mt-1 text-sm text-stone-600">{group.description}</p>
          </div>
          <WorkforceSwitch
            value={workforce}
            onChange={(w) => setParam('workforce', w === 'WHITE_COLLAR' ? '' : w)}
            counts={status === 'ready' ? { WHITE_COLLAR: groups.WHITE_COLLAR.length, BLUE_COLLAR: groups.BLUE_COLLAR.length } : undefined}
          />
        </div>

        {status === 'error' ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-700" role="alert">
            We couldn't load services right now. Please refresh the page.
          </div>
        ) : (
          <div role="region" aria-live="polite" aria-label={group.label}>
            <ServiceGrid services={groups[workforce]} city={selectedCity} loading={status === 'loading'} />
          </div>
        )}

        <div className="text-center sm:text-left">
          <Link to={`/services${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : ''}`} className="dbc-btn dbc-btn-secondary min-h-[44px]">
            View all {status === 'ready' ? categories.length : ''} services
          </Link>
        </div>
      </section>

      {/* Real professionals, only when the API returns some */}
      {(pros.status === 'loading' || pros.items.length > 0) && (
        <section aria-labelledby="mkt-pros" className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 id="mkt-pros" className="text-xl font-bold text-stone-900 font-display sm:text-2xl">
              {selectedCity ? `Professionals in ${selectedCity}` : 'Professionals on DBC'}
            </h2>
            <Link to={prosHref} className="inline-flex min-h-[44px] shrink-0 items-center px-1 text-sm font-semibold text-emerald-800 hover:underline">
              See all
            </Link>
          </div>
          {pros.status === 'loading' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-200/70" />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pros.items.map((p, i) => (
                <li key={p.id} className={i >= 3 ? 'hidden sm:block' : undefined}>
                  <ProfessionalResultCard provider={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* How DBC works */}
      <section aria-labelledby="mkt-how" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-8">
        <h2 id="mkt-how" className="text-xl font-bold text-stone-900 font-display sm:text-2xl">How DBC works</h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-0.5 text-sm text-stone-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-stone-600">
          Choosing a service never books anyone automatically — you decide who to work with after reviewing quotations.{' '}
          <Link to="/know-more" className="font-semibold text-emerald-800 hover:underline">Learn more</Link>
        </p>
      </section>
    </div>
  );
}

