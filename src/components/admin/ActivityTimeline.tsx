interface ActivityEvent {
  id: string;
  description: string;
  time: string;
  icon?: string;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left select-none">
      <div className="border-b border-light-border/40 pb-3">
        <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
          Platform Activity Logs
        </h3>
        <p className="text-2xs text-stone-500 font-medium mt-0.5">
          Real-time operations log and audit trail events.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
          No recent activity logs.
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-light-border">
          {events.map((evt) => (
            <div key={evt.id} className="flex gap-4 items-start relative group">
              <span className="w-10 h-10 rounded-full border border-light-border bg-stone-50 group-hover:bg-stone-100 transition-colors flex items-center justify-center text-sm shrink-0 z-10">
                {evt.icon || '🔔'}
              </span>
              <div className="space-y-1 pt-1.5 flex-1 min-w-0">
                <p className="text-2xs text-stone-800 font-semibold leading-relaxed">
                  {evt.description}
                </p>
                <span className="block text-3xs text-stone-500 font-bold uppercase tracking-wider">
                  {evt.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
