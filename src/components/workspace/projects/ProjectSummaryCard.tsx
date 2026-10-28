interface ProjectSummaryCardProps {
  activeCount: number;
  completedCount: number;
  onHoldCount: number;
  overdueCount: number;
  activeFilter: string;
  onFilterSelect: (filter: string) => void;
}

export function ProjectSummaryCard({
  activeCount,
  completedCount,
  onHoldCount,
  overdueCount,
  activeFilter,
  onFilterSelect,
}: ProjectSummaryCardProps) {
  const cards = [
    { id: 'IN_PROGRESS', label: 'Active Projects', count: activeCount, color: 'text-amber-800', icon: '🏗️' },
    { id: 'COMPLETED', label: 'Completed Jobs', count: completedCount, color: 'text-emerald-800', icon: '✓' },
    { id: 'ON_HOLD', label: 'On Hold', count: onHoldCount, color: 'text-rose-800', icon: '⏸' },
    { id: 'OVERDUE', label: 'Overdue (Mock)', count: overdueCount, color: 'text-red-750', icon: '⚠️' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onFilterSelect(card.id)}
            className={`border rounded-3xl p-5 text-left transition select-none flex flex-col justify-between h-28 cursor-pointer shadow-sm ${
              isActive
                ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/5'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-2xs uppercase font-bold text-stone-400">
                {card.label}
              </span>
              <span className="text-sm">{card.icon}</span>
            </div>

            <span className={`text-2xl font-black font-display block ${card.color}`}>
              {card.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
