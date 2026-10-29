interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-stone-400 text-xs font-semibold">
        <span className="block text-2xl mb-2">⚡</span>
        No recent workspace activities logged.
      </div>
    );
  }

  return (
    <div className="relative pl-4 space-y-5 text-left border-l border-stone-200">
      {activities.map((act) => (
        <div key={act.id} className="relative space-y-1">
          {/* Timeline Dot */}
          <div className="absolute -left-[23px] top-0.5 w-4.5 h-4.5 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-2xs shadow-sm select-none">
            {act.icon}
          </div>
          
          <div className="flex justify-between items-baseline gap-2">
            <h5 className="text-xs font-bold text-stone-900 leading-snug">{act.title}</h5>
            <span className="text-3xs text-stone-500 font-extrabold whitespace-nowrap">{act.time}</span>
          </div>
          <p className="text-2xs text-stone-500 font-semibold leading-relaxed">
            {act.description}
          </p>
        </div>
      ))}
    </div>
  );
}
