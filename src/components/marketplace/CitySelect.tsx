import { SUPPORTED_CITIES } from '../../config/locations';

/** City picker shared by discovery pages. Empty value = all cities. */
export function CitySelect({ value, onChange, id = 'city-select', className = '' }: { value: string; onChange: (city: string) => void; id?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">City</label>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true">
        <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-h-[48px] w-full cursor-pointer appearance-none rounded-2xl border border-stone-300 bg-white pl-10 pr-9 text-base text-stone-900 shadow-xs transition hover:border-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 sm:text-sm"
      >
        <option value="">All cities</option>
        {SUPPORTED_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
