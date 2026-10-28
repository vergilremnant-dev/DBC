export interface CompareItem {
  id: string;
  fullName: string;
  businessName?: string;
  experienceYears: number;
  rating: number;
  skills: string[];
  city: string;
  consultationFee?: number | string;
}

interface ComparisonTableProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function ComparisonTable({ items, onRemove, onClose }: ComparisonTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom duration-300 text-left font-sans">
      <div className="mx-auto max-w-6xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 font-display">
              Compare Professionals ({items.length}/3)
            </h3>
            <p className="text-2xs text-stone-500 font-medium">
              Comparing credentials, rating, and specializations side-by-side.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-100 transition cursor-pointer"
          >
            Minimize ✕
          </button>
        </div>

        {/* Comparison grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Metrics Headers */}
          <div className="hidden md:block space-y-3 pt-10 text-stone-400 text-3xs font-black uppercase tracking-wider">
            <div className="h-9 border-b border-stone-100 flex items-center">Rating Profile</div>
            <div className="h-9 border-b border-stone-100 flex items-center">Experience Level</div>
            <div className="h-9 border-b border-stone-100 flex items-center">Consultation Fee</div>
            <div className="h-12 border-b border-stone-100 flex items-center">Specializations</div>
          </div>

          {/* Items columns */}
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="border border-stone-200 rounded-2xl p-4 bg-stone-50/60 relative space-y-3 shadow-2xs flex flex-col justify-between"
            >
              {/* Remove absolute cross */}
              <button
                onClick={() => onRemove(item.id)}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center font-bold text-2xs shadow-2xs transition cursor-pointer"
                title="Remove from comparison"
              >
                ✕
              </button>

              <div className="space-y-3">
                {/* Profile brief */}
                <div className="space-y-0.5 pr-6">
                  <h4 className="text-xs font-bold text-stone-900 font-display truncate">
                    {item.businessName || item.fullName}
                  </h4>
                  <span className="block text-3xs text-stone-500 font-medium">📍 {item.city}</span>
                </div>

                {/* Rating row */}
                <div className="h-9 md:border-b border-stone-200/80 flex items-center">
                  <span className="md:hidden text-3xs text-stone-400 font-black uppercase tracking-wider mr-2">Rating:</span>
                  <span className="text-xs font-extrabold text-stone-900">⭐ {item.rating.toFixed(1)}</span>
                </div>

                {/* Experience row */}
                <div className="h-9 md:border-b border-stone-200/80 flex items-center">
                  <span className="md:hidden text-3xs text-stone-400 font-black uppercase tracking-wider mr-2">Exp:</span>
                  <span className="text-xs font-extrabold text-stone-900">{item.experienceYears} Years</span>
                </div>

                {/* Fee row */}
                <div className="h-9 md:border-b border-stone-200/80 flex items-center">
                  <span className="md:hidden text-3xs text-stone-400 font-black uppercase tracking-wider mr-2">Fee:</span>
                  <span className="text-xs font-extrabold text-emerald-800">₹{item.consultationFee || '500'}</span>
                </div>

                {/* Skills row */}
                <div className="h-12 md:border-b border-stone-200/80 overflow-y-auto no-scrollbar py-1">
                  <span className="md:hidden text-3xs text-stone-400 font-black uppercase tracking-wider mr-2 block">Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.skills.slice(0, 3).map((s) => (
                      <span key={s} className="text-3xs font-semibold bg-white border border-stone-200 px-1.5 py-0.5 rounded-md text-stone-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ))}

          {/* Empty slot placeholder columns */}
          {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
            <div key={i} className="hidden md:flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl p-6 bg-stone-50/50 text-stone-400 text-2xs font-semibold">
              <span>+ Add slot</span>
              <span className="text-3xs opacity-75 mt-1">Select from listing grid</span>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
