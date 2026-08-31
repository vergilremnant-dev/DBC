interface ProjectFiltersState {
  status: string;
  category: string;
  location: string;
  professional: string;
  customer: string;
  progressRange: string; // e.g. 'ALL', '0_25', '26_50', '51_75', '76_100'
}

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onFilterChange: (filters: ProjectFiltersState) => void;
  onReset: () => void;
  categories: string[];
  professionals: string[];
  customers: string[];
}

export default function ProjectFilters({
  filters,
  onFilterChange,
  onReset,
  categories,
  professionals,
  customers,
}: ProjectFiltersProps) {
  const handleChange = (key: keyof ProjectFiltersState, value: string) => {
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
            Project Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Range */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Progress %
          </label>
          <select
            value={filters.progressRange}
            onChange={(e) => handleChange('progressRange', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Percentages</option>
            <option value="0_25">0% - 25%</option>
            <option value="26_50">26% - 50%</option>
            <option value="51_75">51% - 75%</option>
            <option value="76_100">76% - 100%</option>
          </select>
        </div>

        {/* Professional */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Professional Partner
          </label>
          <select
            value={filters.professional}
            onChange={(e) => handleChange('professional', e.target.value)}
            className="dbc-input bg-white text-stone-755 font-semibold"
          >
            <option value="ALL">All Professionals</option>
            {professionals.map((pro) => (
              <option key={pro} value={pro}>
                {pro}
              </option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Customer Owner
          </label>
          <select
            value={filters.customer}
            onChange={(e) => handleChange('customer', e.target.value)}
            className="dbc-input bg-white text-stone-755 font-semibold"
          >
            <option value="ALL">All Customers</option>
            {customers.map((cust) => (
              <option key={cust} value={cust}>
                {cust}
              </option>
            ))}
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
export type { ProjectFiltersState };
