import StatusBadge from './StatusBadge';
import type { ProjectRecord } from '../../../pages/admin/AdminDashboard';

interface ProjectCardProps {
  project: ProjectRecord;
  onSelectProject: (proj: ProjectRecord) => void;
  onFlagProject: (id: string, name: string) => void;
}

export default function ProjectCard({
  project,
  onSelectProject,
  onFlagProject,
}: ProjectCardProps) {
  return (
    <div className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-shadow flex flex-col justify-between gap-4 text-left select-none md:hidden">
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-2xs font-mono text-stone-450 font-bold shrink-0">
            {project.id}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {project.flagged && (
              <span className="bg-rose-50 border border-rose-100 text-rose-700 text-3xs font-black px-1.5 py-0.5 rounded uppercase">
                ⚠️ Flagged
              </span>
            )}
            <StatusBadge status={project.status} />
          </div>
        </div>

        <div className="space-y-1.5">
          <strong 
            onClick={() => onSelectProject(project)}
            className="text-xs font-black text-stone-900 hover:text-brand-emerald cursor-pointer block leading-snug"
          >
            {project.name}
          </strong>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs text-stone-500 font-semibold">
            <p>👤 Owner: <span className="text-stone-750">{project.customerName}</span></p>
            <p>🛠️ Partner: <span className="text-stone-750">{project.professionalName}</span></p>
            <p>📂 Type: <span className="text-stone-750">{project.category}</span></p>
            <p>📍 Location: <span className="text-stone-750">{project.city}</span></p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 pt-1.5">
            <div className="flex justify-between text-3xs font-black text-stone-500">
              <span>Execution progress:</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-stone-100 border border-stone-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  project.progress === 100 
                    ? 'bg-emerald-600' 
                    : project.progress > 50 
                    ? 'bg-brand-emerald' 
                    : 'bg-amber-500'
                }`}
                style={{ width: `${project.progress}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-light-border/40 pt-3.5 flex justify-between items-center text-3xs font-black uppercase tracking-wider">
        <span className="text-3xs text-stone-500 font-bold">
          Due: {new Date(project.expectedCompletion).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => onSelectProject(project)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-lg text-stone-700 font-bold focus:outline-none"
          >
            Inspect Details
          </button>
          
          {!project.flagged && (
            <button
              onClick={() => onFlagProject(project.id, project.name)}
              className="px-2.5 py-1.5 border border-rose-200 bg-rose-50 text-rose-750 hover:bg-rose-100 rounded-lg font-bold focus:outline-none"
            >
              Flag Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export type { ProjectCardProps };
