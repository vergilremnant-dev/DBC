export interface ProjectPreviewData {
  id: string;
  name: string;
  customerName: string;
  status: string;
  completionDate: string;
  progress: number;
}

interface ProjectPreviewCardProps {
  projects: ProjectPreviewData[];
}

export function ProjectPreviewCard({ projects }: ProjectPreviewCardProps) {
  return (
    <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5">
      {projects.map((proj) => (
        <div
          key={proj.id}
          className="pt-3.5 first:pt-0 text-left text-xs font-semibold text-stone-700 space-y-2.5"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-stone-900 font-display leading-none">
                {proj.name}
              </h4>
              <p className="text-2xs text-stone-400 font-bold">
                Client: <strong className="text-stone-600 font-extrabold">{proj.customerName}</strong>
              </p>
            </div>
            
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider self-start">
              {proj.status}
            </span>
          </div>

          {/* Progress row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${proj.progress}%` }}
              ></div>
            </div>
            <span className="text-2xs text-stone-400 font-mono font-bold leading-none w-8 text-right">
              {proj.progress}%
            </span>
          </div>

          <div className="text-3xs text-stone-400 font-bold uppercase tracking-wider">
            Expected Completion: <strong className="text-stone-600 font-extrabold">{proj.completionDate}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
