interface NotificationEmptyStateProps {
  onGoHome: () => void;
}

export function NotificationEmptyState({ onGoHome }: NotificationEmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto space-y-6">
      {/* Premium checked bell illustration */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-emerald-100">
          🔔
        </div>
        <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-md">
          ✓
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-extrabold text-stone-900 font-display">
          You're all caught up!
        </h3>
        <p className="text-xs text-stone-400 font-semibold leading-relaxed max-w-sm mx-auto">
          We'll notify you when there's something important related to your layout plans, bookings, or payments.
        </p>
      </div>

      <button
        onClick={onGoHome}
        className="rounded-xl bg-stone-900 hover:bg-stone-850 px-6 py-2.5 text-xs font-bold text-white transition shadow cursor-pointer uppercase tracking-wider"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
