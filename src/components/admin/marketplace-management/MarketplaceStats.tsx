interface MarketplaceStatsProps {
  total: number;
  openCount: number;
  closedCount: number;
  reportedCount: number;
  hiddenCount: number;
  pendingReviewCount: number;
}

export default function MarketplaceStats({
  total,
  openCount,
  closedCount,
  reportedCount,
  hiddenCount,
  pendingReviewCount,
}: MarketplaceStatsProps) {
  const stats = [
    { icon: '📋', count: total, label: 'Total Posts', desc: 'All requirements', color: 'bg-blue-50 text-blue-800' },
    { icon: '🟢', count: openCount, label: 'Open', desc: 'Active marketplace leads', color: 'bg-emerald-50 text-emerald-800' },
    { icon: '🔴', count: closedCount, label: 'Closed', desc: 'Concluded contracts', color: 'bg-stone-50 text-stone-600' },
    { icon: '🚨', count: reportedCount, label: 'Reported', desc: 'Flagged by users', color: 'bg-rose-50 text-rose-700' },
    { icon: '👁️‍🗨️', count: hiddenCount, label: 'Hidden', desc: 'Moderated/inactive', color: 'bg-stone-100 text-stone-600' },
    { icon: '⏳', count: pendingReviewCount, label: 'Pending Review', desc: 'Awaiting checks', color: 'bg-amber-50 text-amber-800' },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <span className={`text-sm p-2 rounded-xl w-fit ${stat.color}`}>
            {stat.icon}
          </span>
          <div className="mt-4 space-y-0.5 text-left">
            <span className="block text-xl font-black text-stone-900 leading-none">
              {stat.count}
            </span>
            <span className="block text-3xs font-black text-stone-900 uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="block text-3xs text-stone-500 font-medium">
              {stat.desc}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
