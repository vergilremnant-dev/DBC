export interface ActivityItem {
  id: string;
  type: 'LEAD' | 'BOOKING' | 'PROJECT' | 'MESSAGE' | 'SYSTEM';
  content: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'LEAD': return '⚡';
      case 'BOOKING': return '📅';
      case 'PROJECT': return '🏗️';
      case 'MESSAGE': return '💬';
      default: return '🔔';
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3 text-left">
      <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
        Recent Business Activity
      </h3>

      <div className="divide-y divide-stone-100 space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
        {activities.map((act) => (
          <div
            key={act.id}
            className="pt-3 first:pt-0 flex items-start gap-3 text-xs font-semibold text-stone-600"
          >
            <span className="text-sm bg-stone-50 border border-stone-150 p-1.5 rounded-xl shadow-inner select-none leading-none">
              {getIcon(act.type)}
            </span>
            <div className="space-y-0.5 flex-1">
              <p className="text-stone-700 leading-normal text-2xs">{act.content}</p>
              <span className="text-3xs text-stone-500 font-bold block">
                {act.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
