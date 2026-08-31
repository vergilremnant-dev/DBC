interface VerificationFiltersState {
  role: string;
  status: string;
  documentType: string;
  submissionDate: string; // e.g. 'ALL', 'TODAY', 'WEEK', 'MONTH'
  location: string;
}

interface VerificationFiltersProps {
  filters: VerificationFiltersState;
  onFilterChange: (filters: VerificationFiltersState) => void;
  onReset: () => void;
  roles: string[];
  locations: string[];
}

export default function VerificationFilters({
  filters,
  onFilterChange,
  onReset,
  roles,
  locations,
}: VerificationFiltersProps) {
  const handleChange = (key: keyof VerificationFiltersState, value: string) => {
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
        {/* Role */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Account Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Verification Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Additional Information Requested">Additional Information Requested</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {/* Document Type */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Document Type
          </label>
          <select
            value={filters.documentType}
            onChange={(e) => handleChange('documentType', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Document Types</option>
            <option value="Identity Proof">Identity Proof</option>
            <option value="Business Registration">Business Registration</option>
            <option value="Professional License">Professional License</option>
            <option value="GST Certificate">GST Certificate</option>
          </select>
        </div>

        {/* Submission Date */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            Submission Date
          </label>
          <select
            value={filters.submissionDate}
            onChange={(e) => handleChange('submissionDate', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">Anytime</option>
            <option value="TODAY">Submitted Today</option>
            <option value="WEEK">Submitted This Week</option>
            <option value="MONTH">Submitted This Month</option>
          </select>
        </div>

        {/* Location search */}
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
            City/Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="dbc-input bg-white text-stone-750 font-semibold"
          >
            <option value="ALL">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
export type { VerificationFiltersState };
