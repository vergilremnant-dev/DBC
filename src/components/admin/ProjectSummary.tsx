interface ProjectSummaryProps {
  activeCount: number;
  completedCount: number;
  onHoldCount: number;
  cancelledCount: number;
  onViewProjects: () => void;
}

export default function ProjectSummary({
  activeCount,
  completedCount,
  onHoldCount,
  cancelledCount,
  onViewProjects,
}: ProjectSummaryProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-5 text-left select-none">
      <div className="flex justify-between items-center border-b border-light-border/40 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
            Escrow Projects Summary
          </h3>
          <p className="text-2xs text-stone-500 font-medium mt-0.5">
            Overview of project delivery milestones and financial phases.
          </p>
        </div>
        <button
          onClick={onViewProjects}
          className="text-3xs font-black uppercase text-brand-emerald hover:underline cursor-pointer focus:outline-none"
        >
          View Projects &rarr;
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-stone-700">
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
          <span className="block text-3xs font-black text-stone-400 uppercase tracking-wider">
            Active
          </span>
          <span className="text-base font-extrabold text-stone-900">{activeCount}</span>
        </div>
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <span className="block text-3xs font-black text-stone-455 uppercase tracking-wider text-brand-emerald">
            Completed
          </span>
          <span className="text-base font-extrabold text-brand-emerald">{completedCount}</span>
        </div>
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
          <span className="block text-3xs font-black text-amber-500 uppercase tracking-wider">
            On Hold
          </span>
          <span className="text-base font-extrabold text-amber-700">{onHoldCount}</span>
        </div>
        <div className="p-3 bg-stone-100/50 border border-stone-200 rounded-xl">
          <span className="block text-3xs font-black text-stone-400 uppercase tracking-wider">
            Cancelled
          </span>
          <span className="text-base font-extrabold text-stone-600">{cancelledCount}</span>
        </div>
      </div>
    </div>
  );
}
