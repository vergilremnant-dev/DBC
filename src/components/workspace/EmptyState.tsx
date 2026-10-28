interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 md:p-12 text-center space-y-4">
      <div className="w-14 h-14 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-inner border border-stone-100">
        {icon}
      </div>
      
      <div className="max-w-md mx-auto space-y-1">
        <h4 className="text-xs font-bold text-stone-900 leading-snug">
          {title}
        </h4>
        <p className="text-2xs text-stone-450 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="bg-stone-900 hover:bg-stone-850 text-white font-bold text-2xs px-4 py-2 rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
