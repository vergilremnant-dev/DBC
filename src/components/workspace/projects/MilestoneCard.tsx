export interface MilestoneItem {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface MilestoneCardProps {
  milestones: MilestoneItem[];
  onToggleMilestone: (id: string) => void;
}

export function MilestoneCard({ milestones, onToggleMilestone }: MilestoneCardProps) {
  return (
    <div className="space-y-3.5 text-left text-xs font-semibold text-stone-700">
      <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
        Project Milestones Checklist
      </span>

      <div className="grid gap-3 sm:grid-cols-2">
        {milestones.map((m) => (
          <div
            key={m.id}
            onClick={() => onToggleMilestone(m.id)}
            className={`border rounded-2xl p-3.5 flex items-start gap-3 transition-all duration-200 bg-white hover:shadow-sm cursor-pointer select-none ${
              m.completed
                ? 'border-emerald-600 ring-2 ring-emerald-600/5'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <input
              type="checkbox"
              checked={m.completed}
              onChange={() => {}} // handled by div click
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
            
            <div className="space-y-1">
              <span className={`block text-xs font-bold leading-snug ${
                m.completed ? 'text-stone-900 line-through font-extrabold' : 'text-stone-700'
              }`}>
                {m.title}
              </span>
              <span className="block text-3xs text-stone-400 font-bold uppercase">
                Due: <strong className="text-stone-500 font-extrabold">{m.dueDate}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
