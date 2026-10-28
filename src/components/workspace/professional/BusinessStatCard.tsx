interface BusinessStatItem {
  label: string;
  value: string | number;
  icon: string;
  colorClass?: string;
  subtext?: string;
}

interface BusinessStatCardProps {
  stats: BusinessStatItem[];
}

export function BusinessStatCard({ stats }: BusinessStatCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between select-none relative overflow-hidden h-28"
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-stone-400 tracking-wider">
              {stat.label}
            </span>
            <span className="text-sm select-none">{stat.icon}</span>
          </div>

          <div className="space-y-0.5">
            <span className={`text-xl font-black font-display block ${stat.colorClass || 'text-stone-900'}`}>
              {stat.value}
            </span>
            {stat.subtext && (
              <span className="text-3xs text-stone-400 font-bold block truncate">
                {stat.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
