import { useState } from 'react';

export interface FilterState {
  city: string;
  category: string;
  experienceYears: number;
  isVerified: boolean;
  minFee: number;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  categoriesList: string[];
  citiesList: string[];
}

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  categoriesList,
  citiesList,
}: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  // Count active non-default filters
  const activeFilterCount = [
    Boolean(filters.city),
    Boolean(filters.category),
    filters.experienceYears > 0,
    filters.isVerified,
    filters.minFee > 0,
  ].filter(Boolean).length;

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5 text-left">
      
      {/* Filter Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 font-display">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-2xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-2xs font-black uppercase tracking-wider text-rose-700 hover:text-rose-800 transition cursor-pointer"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="md:hidden text-2xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-4">
          
          {/* Location City Selection */}
          <div className="space-y-1.5">
            <label htmlFor="city-filter" className="block text-2xs font-bold uppercase tracking-wider text-stone-500">
              Location / Region
            </label>
            <select
              id="city-filter"
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full text-xs bg-stone-50/60 hover:bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 cursor-pointer transition"
            >
              <option value="">All Regions</option>
              {citiesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Category Selection */}
          <div className="space-y-1.5">
            <label htmlFor="category-filter" className="block text-2xs font-bold uppercase tracking-wider text-stone-500">
              Service / Category
            </label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full text-xs bg-stone-50/60 hover:bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 cursor-pointer transition"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Experience level slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-2xs font-bold uppercase tracking-wider text-stone-500">
              <label htmlFor="experience-filter">Min Experience</label>
              <span className="text-stone-900 font-extrabold">{filters.experienceYears || '0'}+ Years</span>
            </div>
            <input
              id="experience-filter"
              type="range"
              min="0"
              max="20"
              value={filters.experienceYears}
              onChange={(e) => updateFilter('experienceYears', parseInt(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />
          </div>

          {/* Verification Checkbox */}
          <div className="pt-2 border-t border-stone-100">
            <label
              htmlFor="verification-filter"
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <input
                id="verification-filter"
                type="checkbox"
                checked={filters.isVerified}
                onChange={(e) => updateFilter('isVerified', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 border-stone-300 focus:ring-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-800 transition">
                Verified Partners Only
              </span>
            </label>
          </div>

        </div>
      )}
    </div>
  );
}
