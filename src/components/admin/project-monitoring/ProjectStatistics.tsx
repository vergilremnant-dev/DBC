interface ProjectStatisticsProps {
  total: number;
  activeCount: number;
  completedCount: number;
  onHoldCount: number;
  cancelledCount: number;
  nearDeadlineCount: number;
}

export default function ProjectStatistics({
  total,
  activeCount,
  completedCount,
  onHoldCount,
  cancelledCount,
  nearDeadlineCount,
}: ProjectStatisticsProps) {
  const stats = [
    { icon: '💼', count: total, label: 'Total Portfolio', desc: 'All database projects', color: 'bg-blue-50 text-blue-800' },
    { icon: '🏗️', count: activeCount, label: 'Active Projects', desc: 'Ongoing execution', color: 'bg-emerald-50 text-emerald-800' },
    { icon: '✅', count: completedCount, label: 'Completed', desc: 'Successful handovers', color: 'bg-stone-50 text-stone-600' },
    { icon: '⏳', count: onHoldCount, label: 'On Hold', desc: 'Waiting/paused milestones', color: 'bg-amber-50 text-amber-800' },
    { icon: '🚫', count: cancelledCount, label: 'Cancelled', desc: 'Terminated agreements', color: 'bg-stone-100 text-stone-550' },
    { icon: '🚨', count: nearDeadlineCount, label: 'Near Deadline', desc: 'Clashing milestone schedules', color: 'bg-rose-50 text-rose-700' },
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
            <span className="block text-3xs text-stone-450 font-medium">
              {stat.desc}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
