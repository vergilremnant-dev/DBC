interface BookingTimelineProps {
  status: string;
}

export function BookingTimeline({ status }: BookingTimelineProps) {
  const norm = status.trim().toLowerCase();

  const stages = [
    { key: 'requested', label: 'Submitted', active: true },
    { key: 'confirmed', label: 'Under Review', active: ['confirmed', 'scheduled', 'in progress', 'completed'].includes(norm) },
    { key: 'discussion', label: 'Proposal', active: ['in progress', 'completed'].includes(norm) },
    { key: 'work started', label: 'Project Started', active: ['in progress', 'completed'].includes(norm) },
    { key: 'completed', label: 'Project Completed', active: norm === 'completed' },
  ];

  return (
    <div className="space-y-3">
      <span className="block text-3xs uppercase font-black text-stone-600 tracking-wider">Project Timeline</span>
      
      {/* Horizontal timeline for larger viewports / Vertical for small */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        {stages.map((stg, idx) => (
          <div key={stg.key} className="flex sm:flex-col items-center gap-2.5 flex-1 relative w-full">
            
            {/* Step Icon circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-black border transition-all duration-300 z-10 ${
                stg.active
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                  : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              {idx + 1}
            </div>

            {/* Connecting lines for desktop */}
            {idx < stages.length - 1 && (
              <div
                className={`hidden sm:block absolute left-1/2 top-3 right-[-50%] h-[2px] -z-0 transition-all duration-300 ${
                  stages[idx + 1].active ? 'bg-emerald-600' : 'bg-stone-200'
                }`}
              />
            )}

            {/* Step Title Label */}
            <span
              className={`text-3xs uppercase tracking-wider font-extrabold transition-all duration-300 ${
                stg.active ? 'text-stone-850' : 'text-stone-400'
              }`}
            >
              {stg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
