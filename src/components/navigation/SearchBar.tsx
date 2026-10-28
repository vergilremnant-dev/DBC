import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  selectedCity: string;
  onCitySelect: (city: string) => void;
  popularCities: string[];
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  selectedCity,
  onCitySelect,
  popularCities,
  placeholder = 'Search professionals, services...',
  className = '',
}: SearchBarProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close location dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCitySelect(customInput.trim());
      setCustomInput('');
      setIsLocationOpen(false);
    }
  };

  const getServingRegion = (city: string) => {
    const norm = city.toLowerCase();
    if (norm.includes('hyderabad')) return 'Telangana';
    if (norm.includes('chennai')) return 'Tamil Nadu';
    if (norm.includes('bangalore') || norm.includes('bengaluru')) return 'Karnataka';
    if (norm.includes('mumbai')) return 'Maharashtra';
    if (norm.includes('delhi')) return 'NCR';
    return 'Local Region';
  };

  return (
    <div className={`relative w-full md:w-[320px] lg:w-[360px] ${className}`} ref={dropdownRef}>
      {/* Unified Discovery Bar Wrapper */}
      <div className="flex items-center gap-2 bg-stone-50 hover:bg-white focus-within:bg-white border border-stone-200 hover:border-stone-400 focus-within:border-brand-emerald focus-within:ring-2 focus-within:ring-brand-emerald/15 rounded-xl px-2.5 py-1.5 transition-all duration-200 shadow-xs">
        
        {/* Left Section: Location Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsLocationOpen(!isLocationOpen)}
          className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition focus:outline-none flex-shrink-0 cursor-pointer select-none"
          aria-label="Change active location"
        >
          <span className="text-xs">📍</span>
          <div className="flex flex-col text-left leading-none">
            <span className="text-2xs font-extrabold text-stone-black max-w-[65px] truncate">{selectedCity}</span>
            <span className="text-3xs text-stone-gray font-semibold mt-0.5 tracking-wide">{getServingRegion(selectedCity)}</span>
          </div>
          <span className="text-3xs text-stone-gray pr-0.5">▼</span>
        </button>

        {/* Separator Divider */}
        <span className="h-5 w-px bg-stone-200 flex-shrink-0" aria-hidden="true" />

        {/* Center Section: Input search */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="text-stone-400 text-xs pointer-events-none select-none flex-shrink-0">🔍</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs font-semibold text-stone-850 placeholder:text-stone-400 focus:outline-none border-none p-0"
          />
        </div>

        {/* Right Section: Filter Settings Action */}
        <button
          type="button"
          onClick={() => alert('Advanced Search Filter Drawer initiated.')}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-805 hover:bg-stone-100 transition focus:outline-none flex-shrink-0 cursor-pointer select-none"
          aria-label="Search filter options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Absolute Dropdown Panel for Locations list */}
      {isLocationOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl border border-light-border bg-white p-3 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleCustomSubmit} className="relative">
            <input
              type="text"
              placeholder="Enter city or area..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full text-xs border border-light-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
            />
          </form>
          
          <div className="space-y-1">
            <span className="block text-3xs uppercase tracking-wider font-extrabold text-stone-gray">Popular Cities</span>
            {popularCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onCitySelect(city);
                  setIsLocationOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-semibold hover:bg-light-stone hover:text-stone-black transition cursor-pointer focus:bg-light-stone focus:outline-none ${selectedCity.toLowerCase() === city.toLowerCase() ? 'bg-brand-emerald/10 text-brand-emerald font-extrabold' : 'text-stone-gray'}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default SearchBar;
