interface GrowthSummaryProps {
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  totalActive: number;
}

export default function GrowthSummary({
  newToday,
  newThisWeek,
  newThisMonth,
  totalActive,
}: GrowthSummaryProps) {
  const metrics = [
    { label: 'New Users Today', count: newToday, trend: '+12% vs yesterday', isPositive: true },
    { label: 'New Users This Week', count: newThisWeek, trend: '+8% vs last week', isPositive: true },
    { label: 'New Users This Month', count: newThisMonth, trend: '+18% vs last month', isPositive: true },
    { label: 'Active Users (MAU)', count: totalActive, trend: '92% activity rate', isPositive: true },
  ];

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-left select-none space-y-4">
      <div className="border-b border-light-border/40 pb-2">
        <h4 className="text-2xs font-black uppercase text-stone-905 tracking-wider">
          📈 User Growth Summary
        </h4>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-stone-50/50 border border-stone-150 p-4 rounded-2xl space-y-1.5">
            <span className="block text-3xs font-black text-stone-500 uppercase tracking-widest leading-none">
              {m.label}
            </span>
            <span className="block text-xl font-black text-stone-900 leading-none">
              {m.count}
            </span>
            <div className="flex items-center gap-1 text-3xs font-semibold">
              <span className={m.isPositive ? 'text-emerald-700' : 'text-stone-500'}>
                {m.isPositive ? '▲' : '■'} {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export type { GrowthSummaryProps };
