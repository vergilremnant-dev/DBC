interface NotificationSummaryProps {
  unreadCount: number;
  todayCount: number;
  weekCount: number;
  archivedCount: number;
  activeFilter: string;
  onFilterSelect: (filter: string) => void;
}

export function NotificationSummaryCard({
  unreadCount,
  todayCount,
  weekCount,
  archivedCount,
  activeFilter,
  onFilterSelect,
}: NotificationSummaryProps) {
  const cards = [
    {
      id: 'UNREAD',
      label: 'Unread Updates',
      count: unreadCount,
      icon: '🔔',
      activeBg: 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/10',
      activeText: 'text-emerald-800',
      countColor: 'text-rose-600'
    },
    {
      id: 'TODAY',
      label: 'Received Today',
      count: todayCount,
      icon: '⚡',
      activeBg: 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/10',
      activeText: 'text-blue-800',
      countColor: 'text-blue-600'
    },
    {
      id: 'THIS_WEEK',
      label: 'This Week',
      count: weekCount,
      icon: '📅',
      activeBg: 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/10',
      activeText: 'text-indigo-800',
      countColor: 'text-indigo-600'
    },
    {
      id: 'ARCHIVED',
      label: 'Archived Stack',
      count: archivedCount,
      icon: '📦',
      activeBg: 'border-stone-600 bg-stone-100/80 ring-1 ring-stone-650/10',
      activeText: 'text-stone-900',
      countColor: 'text-stone-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onFilterSelect(card.id)}
            className={`border rounded-2xl p-4 bg-white shadow-sm hover:shadow transition duration-200 cursor-pointer flex flex-col justify-between select-none relative overflow-hidden group ${
              isActive ? card.activeBg : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            {/* Ambient hover light */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-stone-100 rounded-full group-hover:scale-150 transition-all duration-300 pointer-events-none opacity-40"></div>
            
            <div className="flex items-center justify-between">
              <span className={`text-2xs font-black uppercase tracking-wider ${isActive ? card.activeText : 'text-stone-600'}`}>
                {card.label}
              </span>
              <span className="text-sm">{card.icon}</span>
            </div>
            
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-display ${isActive ? card.countColor : 'text-stone-900'}`}>
                {card.count}
              </span>
              <span className="text-3xs font-bold text-stone-500">items</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
