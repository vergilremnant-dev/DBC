import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../services/search/searchService';
import type { SearchSuggestions } from '../../types/search/searchTypes';
import type { ServiceCategory } from '../../types/category/categoryTypes';
import { ServiceIcon } from './ServiceIcon';
import { workforceLabel } from '../../hooks/marketplace/useServiceCatalog';

type Option =
  | { kind: 'service'; key: string; label: string; meta: string; slug: string }
  | { kind: 'professional'; key: string; label: string; meta: string; id: string }
  | { kind: 'search'; key: string; label: string; meta: string; q: string };

interface ServiceSearchProps {
  /** Pre-filled text (e.g. the current ?q=). */
  initialQuery?: string;
  /** City to carry into service pages and search results. Empty = all cities. */
  city?: string;
  /** Catalog used to turn "popular searches" into exact service links. */
  catalog?: ServiceCategory[];
  size?: 'md' | 'lg';
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const withCity = (path: string, city?: string) => (city ? `${path}${path.includes('?') ? '&' : '?'}city=${encodeURIComponent(city)}` : path);

/**
 * Marketplace search with live suggestions from GET /api/search/suggestions
 * (backend catalog resolver: exact, partial, synonym and spelling matches).
 * ARIA combobox: ↑/↓ to move, Enter to open, Esc to close.
 */
export function ServiceSearch({ initialQuery = '', city, catalog, size = 'md', placeholder = 'Search services or professionals', autoFocus, className = '' }: ServiceSearchProps) {
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [data, setData] = useState<SearchSuggestions | null>(null);

  // Follow external changes to the query (e.g. back/forward navigation) without an effect.
  const [syncedQuery, setSyncedQuery] = useState(initialQuery);
  if (syncedQuery !== initialQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  // Debounced suggestions; stale requests are aborted.
  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setState('loading'); // inside the timer callback, not synchronously in the effect
      searchApi
        .getSuggestions(q, ctrl.signal)
        .then((s) => {
          setData(s);
          setState('ready');
        })
        .catch((err) => {
          if (ctrl.signal.aborted || err?.name === 'CanceledError') return;
          setState('error');
        });
    }, q.length < 2 ? 0 : 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, open]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const q = value.trim();
  const options = useMemo<Option[]>(() => {
    if (!data) return [];
    const out: Option[] = [];
    if (q.length < 2) {
      // Popular searches → exact catalog services where the label matches.
      for (const term of data.popularSearches) {
        const cat = catalog?.find((c) => c.name.toLowerCase() === term.toLowerCase());
        if (cat) out.push({ kind: 'service', key: `p-${cat.slug}`, label: cat.name, meta: workforceLabel(cat.categoryType), slug: cat.slug });
      }
      return out;
    }
    for (const c of data.categories) out.push({ kind: 'service', key: `s-${c.slug}`, label: c.name, meta: workforceLabel(c.categoryType) || 'Service', slug: c.slug });
    for (const p of data.professionals) out.push({ kind: 'professional', key: `p-${p.id}`, label: p.businessName || p.name, meta: p.businessName ? p.name : 'Professional', id: p.id });
    out.push({ kind: 'search', key: 'search', label: `Search for “${q}”`, meta: city ? `in ${city}` : 'All professionals', q });
    return out;
  }, [data, q, catalog, city]);

  // Reset the highlighted option whenever the option list changes.
  const [shownOptions, setShownOptions] = useState(options);
  if (shownOptions !== options) {
    setShownOptions(options);
    setActive(-1);
  }

  const go = (opt?: Option) => {
    setOpen(false);
    if (!opt) {
      if (!q) return;
      navigate(withCity(`/search?q=${encodeURIComponent(q)}`, city));
      return;
    }
    if (opt.kind === 'service') navigate(withCity(`/services/${opt.slug}`, city));
    else if (opt.kind === 'professional') navigate(`/professional/${opt.id}`);
    else navigate(withCity(`/search?q=${encodeURIComponent(opt.q)}`, city));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active >= 0 ? options[active] : undefined);
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    }
  };

  const showList = open && (options.length > 0 || state === 'loading' || state === 'error' || (state === 'ready' && q.length >= 2));
  const big = size === 'lg';

  return (
    <div ref={boxRef} className={`relative w-full ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(active >= 0 ? options[active] : undefined);
        }}
        className={`flex items-center gap-2 rounded-2xl border border-stone-300 bg-white shadow-xs transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20 ${big ? 'h-14 pl-4 pr-1.5' : 'h-12 pl-3.5 pr-1'}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5 shrink-0 text-stone-500" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search services or professionals"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-stone-900 placeholder:text-stone-500 outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              inputRef.current?.focus();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
        <button type="submit" className={`dbc-btn dbc-btn-primary shrink-0 ${big ? 'dbc-btn-lg h-11 px-5' : 'h-10 px-4'}`}>
          Search
        </button>
      </form>

      {showList && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
          {q.length < 2 && options.length > 0 && <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-stone-600">Popular services</p>}
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[min(22rem,60vh)] overflow-y-auto py-1.5">
            {options.map((opt, i) => (
              <li
                key={opt.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(opt)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? 'bg-stone-100' : ''}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${opt.kind === 'service' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
                  {opt.kind === 'service' ? (
                    <ServiceIcon slug={opt.slug} className="h-5 w-5" />
                  ) : opt.kind === 'professional' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-900">{opt.label}</span>
                  <span className="block truncate text-xs text-stone-600">{opt.meta}</span>
                </span>
              </li>
            ))}
          </ul>
          {state === 'loading' && options.length === 0 && <p className="px-4 py-3 text-sm text-stone-600" role="status">Searching…</p>}
          {state === 'error' && <p className="px-4 py-3 text-sm text-stone-600" role="status">Suggestions are unavailable right now. Press Enter to search.</p>}
          {state === 'ready' && q.length >= 2 && data && data.categories.length === 0 && data.professionals.length === 0 && (
            <p className="border-t border-stone-100 px-4 py-2.5 text-xs text-stone-600">No matching service. Try words like “plumber”, “leak” or “interior”.</p>
          )}
        </div>
      )}
    </div>
  );
}
