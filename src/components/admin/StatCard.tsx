interface StatCardProps {
  icon: string;
  count: string | number;
  label: string;
  description: string;
  colorClass?: string;
}

export default function StatCard({ icon, count, label, description, colorClass = 'bg-stone-50 text-stone-800' }: StatCardProps) {
  return (
    <div 
      className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between select-none relative group"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-between items-start">
        <span className={`text-base p-2.5 rounded-xl w-fit transition-colors duration-200 ${colorClass}`}>
          {icon}
        </span>
        <span className="text-3xs font-black text-stone-400 uppercase tracking-widest group-hover:text-stone-600 transition-colors">
          Metrics
        </span>
      </div>
      <div className="mt-4 space-y-1 text-left">
        <span className="block text-2xl font-black text-stone-900 font-sans tracking-tight">
          {count}
        </span>
        <span className="block text-2xs font-black text-stone-900 uppercase tracking-wider">
          {label}
        </span>
        <p className="text-2xs text-stone-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
