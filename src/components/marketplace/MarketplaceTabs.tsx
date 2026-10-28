export type MarketplaceTabType = 'professionals' | 'services' | 'projects' | 'consultants';

interface MarketplaceTabsProps {
  activeTab: MarketplaceTabType;
  onTabChange: (tab: MarketplaceTabType) => void;
  counts: Record<MarketplaceTabType, number>;
}

export function MarketplaceTabs({ activeTab, onTabChange, counts }: MarketplaceTabsProps) {
  const tabsList: { type: MarketplaceTabType; label: string }[] = [
    { type: 'professionals', label: 'Professionals' },
    { type: 'consultants', label: 'Consultants' },
    { type: 'services', label: 'Services' },
    { type: 'projects', label: 'Projects' },
  ];

  return (
    <div className="flex bg-stone-100/90 p-1 rounded-xl border border-stone-200/80 w-full overflow-x-auto no-scrollbar">
      {tabsList.map((t) => {
        const isActive = activeTab === t.type;
        return (
          <button
            key={t.type}
            onClick={() => onTabChange(t.type)}
            className={`flex-1 min-w-max text-center py-1.5 px-3 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 ${
              isActive
                ? 'bg-emerald-700 text-white font-extrabold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`text-3xs px-1.5 py-0.1 rounded ${
                isActive ? 'bg-emerald-800 text-white font-bold' : 'bg-stone-200/80 text-stone-600'
              }`}
            >
              {counts[t.type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

