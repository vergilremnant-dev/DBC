interface MarketplaceFiltersState {
  status: string;
  category: string;
  location: string;
  budgetRange: string; // e.g. 'ALL', 'UNDER_50K', '50K_100K', 'OVER_100K'
  propertyType: string; // e.g. 'ALL', 'Residential', 'Commercial'
  postedDate: string; // e.g. 'ALL', 'TODAY', 'WEEK', 'MONTH'
}

interface MarketplaceFiltersProps {
  filters: MarketplaceFiltersState;
  onFilterChange: (filters: MarketplaceFiltersState) => void;
  onReset: () => void;
  categories: string[];
}

export default function MarketplaceFilters({
  filters,
  onFilterChange,
  onReset,
  categories,
}: MarketplaceFiltersProps) {
  const handleChange = (key: keyof MarketplaceFiltersState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-5 text-left select-none">
      <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
        <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
          Filter Options
        </h3>
        <button
          onClick={onReset}
          className="text-[9px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-wider focus:outline-none"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        {/* Status */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Listing Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Hidden">Hidden</option>
            <option value="Reported">Reported</option>
            <option value="Pending Review">Pending Review</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Project Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Budget Range
          </label>
          <select
            value={filters.budgetRange}
            onChange={(e) => handleChange('budgetRange', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Budgets</option>
            <option value="UNDER_50K">Under ₹50,000</option>
            <option value="50K_100K">₹50,000 - ₹1,00,000</option>
            <option value="OVER_100K">Over ₹1,00,000</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Property Type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Properties</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Plot">Plot/Open Land</option>
          </select>
        </div>

        {/* Posted Date */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Posted Date
          </label>
          <select
            value={filters.postedDate}
            onChange={(e) => handleChange('postedDate', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">Anytime</option>
            <option value="TODAY">Posted Today</option>
            <option value="WEEK">Posted This Week</option>
            <option value="MONTH">Posted This Month</option>
          </select>
        </div>

        {/* Location search */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            City/Location
          </label>
          <input
            type="text"
            placeholder="e.g. Hyderabad..."
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="dbc-input text-stone-750 font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
export type { MarketplaceFiltersState };
