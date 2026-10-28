interface LeadEmptyStateProps {
  onRefresh: () => void;
}

export function LeadEmptyState({ onRefresh }: LeadEmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto space-y-6">
      {/* Premium checked bell illustration */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-amber-100">
          ⚡
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-extrabold text-stone-900 font-display">
          No matching leads available right now.
        </h3>
        <p className="text-xs text-stone-400 font-semibold leading-relaxed max-w-sm mx-auto">
          Try expanding your category dropdown parameters or adjusting budget filters to browse additional requirements.
        </p>
      </div>

      <button
        onClick={onRefresh}
        className="rounded-xl bg-stone-900 hover:bg-stone-850 px-6 py-2.5 text-xs font-bold text-white transition shadow cursor-pointer uppercase tracking-wider"
      >
        Refresh Leads Catalog
      </button>
    </div>
  );
}
