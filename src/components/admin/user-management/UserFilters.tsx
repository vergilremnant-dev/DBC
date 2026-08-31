interface UserFiltersState {
  role: string;
  status: string;
  verificationStatus: string;
  registrationDate: string; // e.g. 'ALL', 'TODAY', 'WEEK', 'MONTH'
  location: string;
}

interface UserFiltersProps {
  filters: UserFiltersState;
  onFilterChange: (filters: UserFiltersState) => void;
  onReset: () => void;
}

export default function UserFilters({ filters, onFilterChange, onReset }: UserFiltersProps) {
  const handleChange = (key: keyof UserFiltersState, value: string) => {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        {/* Role Filter */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Platform Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Professional">Professional</option>
            <option value="Consultant">Consultant</option>
            <option value="Admin">Administrator</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Account Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending Verification">Pending Verification</option>
          </select>
        </div>

        {/* Verification Status */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Verification Status
          </label>
          <select
            value={filters.verificationStatus}
            onChange={(e) => handleChange('verificationStatus', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Registration Date */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Registration Date
          </label>
          <select
            value={filters.registrationDate}
            onChange={(e) => handleChange('registrationDate', e.target.value)}
            className="dbc-input bg-white text-stone-700 font-semibold"
          >
            <option value="ALL">Anytime</option>
            <option value="TODAY">Registered Today</option>
            <option value="WEEK">Joined This Week</option>
            <option value="MONTH">Joined This Month</option>
          </select>
        </div>

        {/* Location search input */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Location/City
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
export type { UserFiltersState };
