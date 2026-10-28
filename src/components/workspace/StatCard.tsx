interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  label: string;
}

export function StatCard({ title, value, icon, label }: StatCardProps) {
  return (
    <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex justify-between items-center text-left transition duration-200">
      <div className="space-y-1">
        <span className="block text-3xs uppercase font-black text-stone-400 tracking-wider">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-stone-900 leading-none">
            {value}
          </span>
          <span className="text-3xs text-stone-450 font-bold uppercase tracking-wide">
            {label}
          </span>
        </div>
      </div>
      <div className="w-9 h-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-base flex-shrink-0 shadow-inner">
        {icon}
      </div>
    </div>
  );
}
