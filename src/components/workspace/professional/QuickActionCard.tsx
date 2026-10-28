interface QuickActionItem {
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

interface QuickActionCardProps {
  actions: QuickActionItem[];
}

export function QuickActionCard({ actions }: QuickActionCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act, idx) => (
        <button
          key={idx}
          onClick={act.action}
          className="bg-white border border-stone-200 hover:border-stone-400 rounded-3xl p-5 text-left shadow-sm hover:shadow transition duration-300 ease-in-out cursor-pointer group flex flex-col justify-between h-32 focus:outline-none"
        >
          <span className="text-2xl group-hover:scale-110 transition duration-300 transform self-start">
            {act.icon}
          </span>
          <div className="space-y-1">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider group-hover:text-emerald-800 transition">
              {act.title}
            </h3>
            <p className="text-2xs text-stone-400 font-semibold leading-relaxed">
              {act.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
