interface LeadSummaryCardProps {
  availableCount: number;
  interestedCount: number;
  savedCount: number;
  closedCount: number;
  activeFilter: string;
  onFilterSelect: (filter: string) => void;
}

export function LeadSummaryCard({
  availableCount,
  interestedCount,
  savedCount,
  closedCount,
  activeFilter,
  onFilterSelect,
}: LeadSummaryCardProps) {
  const cards = [
    { id: 'ALL', label: 'Available Leads', count: availableCount, color: 'text-stone-900', icon: '⚡' },
    { id: 'INTERESTED', label: 'Expressed Interest', count: interestedCount, color: 'text-emerald-700', icon: '🤝' },
    { id: 'SAVED', label: 'Saved Opportunities', count: savedCount, color: 'text-indigo-750', icon: '💾' },
    { id: 'CLOSED', label: 'Closed Leads', count: closedCount, color: 'text-stone-400', icon: '✓' }
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
              <span className="text-2xs uppercase font-bold text-stone-500">
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
