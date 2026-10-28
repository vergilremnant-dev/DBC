import { useState, useRef, useEffect } from 'react';

interface LocationSelectorProps {
  selectedCity: string;
  onCitySelect: (city: string) => void;
  popularCities: string[];
}

export function LocationSelector({ selectedCity, onCitySelect, popularCities }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
      setIsOpen(false);
    }
  };

  const getServingRegion = (city: string) => {
    const norm = city.toLowerCase();
    if (norm.includes('hyderabad')) return 'Serving Telangana';
    if (norm.includes('chennai')) return 'Serving Tamil Nadu';
    if (norm.includes('bangalore') || norm.includes('bengaluru')) return 'Serving Karnataka';
    if (norm.includes('mumbai')) return 'Serving Maharashtra';
    if (norm.includes('delhi')) return 'Serving NCR';
    return 'Serving Local Region';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-light-border bg-white hover:bg-light-stone text-xs transition cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        aria-label="Select location"
      >
        <span className="text-sm">📍</span>
        <div className="flex flex-col text-2xs leading-tight pr-1">
          <span className="font-extrabold text-stone-black truncate max-w-[80px]">{selectedCity}</span>
          <span className="text-3xs text-stone-gray font-semibold tracking-wide whitespace-nowrap">{getServingRegion(selectedCity)}</span>
        </div>
        <span className="text-3xs text-stone-gray">▼</span>
      </button>

      {isOpen && (
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
                onClick={() => {
                  onCitySelect(city);
                  setIsOpen(false);
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
