interface ProjectsSummaryProps {
  inProgressCount: number;
  completedCount: number;
  onHoldCount: number;
  cancelledCount: number;
}

export default function ProjectsSummary({
  inProgressCount,
  completedCount,
  onHoldCount,
  cancelledCount,
}: ProjectsSummaryProps) {
  const items = [
    { label: 'In Progress', count: inProgressCount, color: 'text-blue-700' },
    { label: 'Completed', count: completedCount, color: 'text-emerald-700' },
    { label: 'On Hold', count: onHoldCount, color: 'text-amber-700' },
    { label: 'Cancelled', count: cancelledCount, color: 'text-stone-500' },
  ];

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-left select-none space-y-4">
      <div className="border-b border-light-border/40 pb-2">
        <h4 className="text-2xs font-black uppercase text-stone-905 tracking-wider">
          💼 Project portfolio summary
        </h4>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it, idx) => (
          <div key={idx} className="bg-stone-50/50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
            <span className="block text-3xs font-black text-stone-500 uppercase tracking-widest leading-none">
              {it.label}
            </span>
            <span className={`block text-xl font-black mt-2 leading-none ${it.color}`}>
              {it.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export type { ProjectsSummaryProps };
