interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  budgetFilter: string;
  onBudgetChange: (val: string) => void;
  locationFilter: string;
  onLocationChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function LeadFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  budgetFilter,
  onBudgetChange,
  locationFilter,
  onLocationChange,
  sortBy,
  onSortChange,
  onReset,
  isFiltered,
}: LeadFiltersProps) {
  const categories = ['All', 'Architect', 'Interior Designer', 'Plumber', 'Electrician', 'Masonry'];
  const budgets = ['All', 'Under ₹20,005', '₹20,000 - ₹50,000', 'Above ₹50,000'];

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4 text-xs font-semibold text-stone-700">
      
      {/* Top Search bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by title or details..."
            className="w-full text-xs border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          />
          <span className="absolute left-3.5 top-3 text-stone-400 select-none pointer-events-none">🔍</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Location (e.g. Gachibowli)..."
            className="w-full text-xs border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 md:w-56"
          />
          <span className="absolute left-3 top-3 text-stone-400 select-none pointer-events-none">📍</span>
        </div>
      </div>

      {/* Selectors Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-50 pt-3">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <span className="block text-3xs font-black uppercase text-stone-400 tracking-widest">Trade Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="border border-stone-200 rounded-lg bg-white px-2 py-1 text-stone-850 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Budget Range Dropdown */}
          <div className="space-y-1">
            <span className="block text-3xs font-black uppercase text-stone-400 tracking-widest">Budget Bracket</span>
            <select
              value={budgetFilter}
              onChange={(e) => onBudgetChange(e.target.value)}
              className="border border-stone-200 rounded-lg bg-white px-2 py-1 text-stone-850 focus:outline-none"
            >
              {budgets.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="space-y-1">
            <span className="block text-3xs font-black uppercase text-stone-400 tracking-widest">Sort Sequence</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="border border-stone-200 rounded-lg bg-white px-2 py-1 text-stone-850 focus:outline-none"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="BUDGET_DESC">Highest Budget</option>
              <option value="MATCH_DESC">Best Match Score</option>
            </select>
          </div>
        </div>

        {/* Clear Filter trigger */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="text-2xs font-black uppercase text-rose-700 hover:underline transition cursor-pointer"
          >
            Clear Filters ×
          </button>
        )}

      </div>
    </div>
  );
}
