interface ProjectTimelineProps {
  progress: number;
}

export function ProjectTimeline({ progress }: ProjectTimelineProps) {
  const steps = [
    { label: 'Project Assigned', minVal: 0 },
    { label: 'Initial Discussion', minVal: 20 },
    { label: 'Work Started', minVal: 40 },
    { label: 'Midway Progress', minVal: 60 },
    { label: 'Final Inspection', minVal: 80 },
    { label: 'Completed', minVal: 100 }
  ];

  return (
    <div className="space-y-3.5 text-left text-xs font-semibold text-stone-700">
      <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
        Operational Pipeline Progress
      </span>

      <div className="relative pl-6 space-y-4">
        {/* Timeline vertical bar line */}
        <div className="absolute left-2 top-1.5 bottom-1.5 w-0.5 bg-stone-100">
          <div
            className="w-full bg-emerald-600 transition-all duration-500"
            style={{ height: `${progress}%` }}
          ></div>
        </div>

        {steps.map((step, idx) => {
          const isDone = progress >= step.minVal;
          return (
            <div key={idx} className="flex items-center gap-3 relative">
              {/* Timeline circle point */}
              <span className={`absolute -left-5 w-2.5 h-2.5 rounded-full border-2 transition duration-300 ${
                isDone
                  ? 'bg-emerald-600 border-emerald-600 shadow-sm scale-110'
                  : 'bg-white border-stone-300'
              }`}></span>
              
              <div className="space-y-0.5 leading-none">
                <span className={`text-2xs font-bold ${
                  isDone ? 'text-stone-900 font-extrabold' : 'text-stone-400'
                }`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
