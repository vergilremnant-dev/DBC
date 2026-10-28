interface BookingEmptyStateProps {
  onAction: () => void;
}

export function BookingEmptyState({ onAction }: BookingEmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-12 text-center space-y-4 max-w-xl mx-auto my-6 transition duration-200">
      <div className="w-16 h-16 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner border border-stone-100">
        📅
      </div>
      
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest leading-snug">
          You haven't started a project request yet
        </h4>
        <p className="text-2xs text-stone-450 font-medium leading-relaxed">
          Connect with local experts, submit custom project scope requirements, and request verified service partners directly from our catalog.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onAction}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-2xs px-4.5 py-2.5 rounded-xl transition shadow-sm focus:outline-none"
        >
          Find a Professional
        </button>
      </div>
    </div>
  );
}
