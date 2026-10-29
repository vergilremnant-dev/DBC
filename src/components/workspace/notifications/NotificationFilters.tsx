interface NotificationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function NotificationFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortChange,
  onReset,
  isFiltered,
}: NotificationFiltersProps) {
  const categories = ['ALL', 'Requirements', 'Bookings', 'Messages', 'Consultations', 'Payments', 'System', 'Promotions'];
  const priorities = ['ALL', 'High', 'Medium', 'Low'];
  const sortOptions = [
    { value: 'NEWEST', label: 'Newest First' },
    { value: 'OLDEST', label: 'Oldest First' },
    { value: 'UNREAD_FIRST', label: 'Unread First' },
    { value: 'READ_FIRST', label: 'Read First' },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top row: Search & Status Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notification title or description..."
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2 text-xs text-stone-900 focus:border-stone-450 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs font-bold text-stone-600">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'UNREAD', label: 'Unread Only' },
            { id: 'ARCHIVED', label: 'Archived Stack' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 border border-stone-150'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Dropdowns & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-100 text-xs font-semibold text-stone-600">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs uppercase font-bold text-stone-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-stone-800 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs uppercase font-bold text-stone-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-stone-800 focus:outline-none"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p === 'ALL' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs uppercase font-bold text-stone-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-stone-800 focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters Link */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer transition"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
