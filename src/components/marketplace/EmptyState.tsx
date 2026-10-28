interface EmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  className?: string;
}

export function EmptyState({ title, description, onReset, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`max-w-md mx-auto py-12 sm:py-16 px-6 sm:px-8 border border-dashed border-stone-300 bg-white rounded-3xl text-center space-y-4 shadow-2xs ${className}`}
    >
      {/* Schematic visual wireframe compass/blueprint drawing icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
          🔍
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-bold text-stone-900 font-display">
          {title}
        </h3>
        <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {onReset && (
        <div className="pt-2">
          <button
            onClick={onReset}
            className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Clear Filters</span>
            <span>↺</span>
          </button>
        </div>
      )}
    </div>
  );
}
