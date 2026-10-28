interface ProfileCompletionCardProps {
  percentage: number;
  incompleteItems: { id: string; label: string; action: () => void }[];
}

export function ProfileCompletionCard({ percentage, incompleteItems }: ProfileCompletionCardProps) {
  // Determine color matching progress levels
  const getProgressBarColor = (val: number) => {
    if (val < 50) return 'bg-rose-500';
    if (val < 85) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5 text-left">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-stone-900 font-display">Profile Strength</h3>
          <p className="text-2xs text-stone-400 font-bold uppercase tracking-wider">
            Complete settings to unlock faster expert callbacks
          </p>
        </div>
        <span className="text-xl font-black font-display text-stone-900">{percentage}%</span>
      </div>

      {/* Progress Bar indicator */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist items */}
      {incompleteItems.length > 0 ? (
        <div className="space-y-2.5 pt-3 border-t border-stone-50">
          <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
            Remaining Tasks
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {incompleteItems.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 text-2xs font-bold text-stone-600">
                  <span className="text-stone-300 group-hover:text-stone-500 transition text-xs">○</span>
                  <span>{item.label}</span>
                </div>
                <span className="text-stone-300 group-hover:text-stone-600 transition text-xs font-black">
                  &rarr;
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-stone-50 text-center text-xs font-semibold text-emerald-800 bg-emerald-50/40 py-2.5 rounded-xl border border-emerald-100">
          🎉 Profile is 100% complete! Ready for all premium transactions.
        </div>
      )}
    </div>
  );
}
