interface BookingSummaryCardProps {
  label: string;
  count: number;
  icon: string;
  colorClass?: string;
}

export function BookingSummaryCard({ label, count, icon, colorClass = 'text-stone-400' }: BookingSummaryCardProps) {
  return (
    <div className="bg-white border border-stone-200 p-4.5 rounded-2xl shadow-sm flex justify-between items-center text-left transition duration-200">
      <div className="space-y-1">
        <span className="block text-3xs uppercase font-black text-stone-400 tracking-wider">
          {label}
        </span>
        <span className="block text-2xl font-black text-stone-900 leading-none">
          {count}
        </span>
      </div>
      <div className={`w-9 h-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-base flex-shrink-0 shadow-inner ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
