interface TimelineItem {
  date: string;
  title: string;
  desc: string;
}

interface ProjectTimelineProps {
  timeline: TimelineItem[];
  projectName?: string;
}

export default function ProjectTimeline({ timeline, projectName }: ProjectTimelineProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left select-none">
      <div className="border-b border-light-border/40 pb-3">
        <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
          📅 Chronological Execution Timeline
        </h3>
        {projectName && (
          <p className="text-2xs text-stone-500 font-medium mt-0.5">
            Audit history tracking for {projectName}
          </p>
        )}
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
          No chronological timeline items available for this project.
        </div>
      ) : (
        <div className="space-y-5 relative border-l border-stone-200 pl-4 ml-2">
          {timeline.map((item, idx) => (
            <div key={idx} className="relative space-y-0.5 text-xs font-semibold">
              {/* Timeline bubble bullet */}
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-brand-emerald shadow-apple-xs shrink-0" />
              
              <span className="block text-3xs font-black text-stone-400 uppercase tracking-widest">
                {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <h4 className="font-bold text-stone-900 leading-tight">
                {item.title}
              </h4>
              <p className="text-stone-500 text-2xs leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
