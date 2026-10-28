interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export function QuickActionCard({ title, description, icon, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-left flex items-start gap-4 transition duration-200 w-full group focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
    >
      <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-lg flex-shrink-0 shadow-inner group-hover:bg-emerald-50 group-hover:border-emerald-100 transition duration-200">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 group-hover:text-emerald-800 transition duration-200">
          {title}
        </h4>
        <p className="text-2xs text-stone-450 font-semibold leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
