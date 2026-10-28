interface ProjectEmptyStateProps {
  onBrowseLeads: () => void;
}

export function ProjectEmptyState({ onBrowseLeads }: ProjectEmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto space-y-6">
      {/* Premium checked bell illustration */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-blue-100">
          🏗️
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-extrabold text-stone-900 font-display">
          You don't have any active projects yet.
        </h3>
        <p className="text-xs text-stone-400 font-semibold leading-relaxed max-w-sm mx-auto">
          Accept matched customer leads or coordinate quotes inside your leads marketplace catalog to initialize active project status flows.
        </p>
      </div>

      <button
        onClick={onBrowseLeads}
        className="rounded-xl bg-stone-900 hover:bg-stone-850 px-6 py-2.5 text-xs font-bold text-white transition shadow cursor-pointer uppercase tracking-wider"
      >
        Browse Available Leads
      </button>
    </div>
  );
}
