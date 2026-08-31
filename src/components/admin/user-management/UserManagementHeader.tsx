interface UserManagementHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
}

export default function UserManagementHeader({ onRefresh, onExport }: UserManagementHeaderProps) {
  return (
    <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative select-none">
      <div className="space-y-1 text-left">
        <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
          IAM Workspace
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif leading-tight">
          User Management
        </h1>
        <p className="text-xs text-stone-500 font-medium">
          Manage customers, professionals, consultants, and administrators.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          aria-label="Refresh users list"
        >
          🔄 Refresh
        </button>
        <button
          onClick={onExport}
          className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          aria-label="Export users data as CSV"
        >
          📤 Export CSV
        </button>
      </div>
    </header>
  );
}
