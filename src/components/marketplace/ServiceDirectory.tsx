import { Link } from 'react-router-dom';
import type { ServiceCategory } from '../../types/category/categoryTypes';
import { ServiceIcon } from './ServiceIcon';
import { WORKFORCE_GROUPS, type Workforce } from '../../hooks/marketplace/useServiceCatalog';

/** Segmented switch between the two workforce groups. */
export function WorkforceSwitch({ value, onChange, counts, className = '' }: { value: Workforce; onChange: (w: Workforce) => void; counts?: Partial<Record<Workforce, number>>; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Workforce category" className={`inline-flex w-full max-w-md rounded-2xl bg-stone-200/70 p-1 sm:w-auto ${className}`}>
      {WORKFORCE_GROUPS.map((g) => {
        const on = value === g.type;
        return (
          <button
            key={g.type}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(g.type)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const other = WORKFORCE_GROUPS.find((x) => x.type !== g.type)!;
                onChange(other.type);
                (e.currentTarget.parentElement?.querySelector(`[data-wf="${other.type}"]`) as HTMLElement | null)?.focus();
              }
            }}
            tabIndex={on ? 0 : -1}
            data-wf={g.type}
            className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-center text-sm font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:flex-none sm:px-5 ${
              on ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="min-w-0 sm:whitespace-nowrap">{g.label}</span>
            {counts?.[g.type] !== undefined && (
              <span className={`shrink-0 rounded-full px-1.5 text-xs ${on ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{counts[g.type]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Uniform service tile linking to /services/:slug. */
export function ServiceTile({ category, city }: { category: ServiceCategory; city?: string }) {
  const to = `/services/${category.slug}${city ? `?city=${encodeURIComponent(city)}` : ''}`;
  return (
    <Link
      to={to}
      className="group flex h-full min-h-[112px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-1.5 py-4 sm:px-2 text-center transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 active:translate-y-0"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-700 group-hover:text-white">
        <ServiceIcon slug={category.slug} />
      </span>
      <span lang="en" className="w-full text-[11px] font-semibold min-[360px]:text-xs leading-snug text-stone-900 hyphens-auto [overflow-wrap:break-word] sm:text-sm">{category.name}</span>
    </Link>
  );
}

export function ServiceGrid({ services, city, loading }: { services: ServiceCategory[]; city?: string; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-7" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <li key={i} className="h-[112px] animate-pulse rounded-2xl bg-stone-200/70" />
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-7">
      {services.map((c) => (
        <li key={c.id}>
          <ServiceTile category={c} city={city} />
        </li>
      ))}
    </ul>
  );
}
