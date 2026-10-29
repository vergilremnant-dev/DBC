import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { ProjectStatus } from './ProjectStatusBadge';

export interface ProjectData {
  id: string;
  name: string;
  customerName: string;
  category: string;
  location: string;
  startDate: string;
  completionDate: string;
  status: ProjectStatus;
  progress: number;
  nextMilestone: string;
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  milestones: { id: string; title: string; dueDate: string; completed: boolean }[];
}

interface ProjectCardProps {
  project: ProjectData;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  const getPriorityColors = (prio: ProjectData['priority']) => {
    switch (prio) {
      case 'High':
        return 'bg-rose-50 text-rose-800 border-rose-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Low':
      default:
        return 'bg-stone-50 text-stone-500 border-stone-200';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`border rounded-3xl p-5 text-left bg-white transition hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-600/5 shadow-sm'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="space-y-2">
        {/* Header Badges */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-stone-50 border border-stone-200 text-stone-600 rounded px-2 py-0.5 text-3xs font-black uppercase">
              {project.category}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider border select-none leading-none ${getPriorityColors(project.priority)}`}>
            {project.priority} Priority
          </span>
        </div>

        {/* Project details */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-900 font-display leading-snug">
            {project.name}
          </h3>
          <p className="text-2xs text-stone-500 font-bold">
            Client: <strong className="text-stone-600 font-extrabold">{project.customerName}</strong>
          </p>
        </div>
      </div>

      {/* Progress & Milestone segment */}
      <div className="space-y-2 bg-stone-50/50 border border-stone-100 rounded-xl p-3">
        <div className="flex items-center justify-between text-3xs font-bold text-stone-600 uppercase tracking-wider">
          <span>Milestone Completion</span>
          <span className="font-mono text-stone-700 font-bold">{project.progress}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>

        <div className="pt-1.5 border-t border-stone-100/50 flex justify-between items-center text-3xs font-bold text-stone-600 uppercase tracking-wider">
          <span>Next Up</span>
          <span className="text-stone-700 truncate block max-w-xs">{project.nextMilestone}</span>
        </div>
      </div>

      {/* Date / Location Info row */}
      <div className="flex items-center justify-between border-t border-stone-50 pt-3 text-3xs font-black uppercase tracking-wider text-stone-600">
        <span>📍 {project.location}</span>
        <span>Est. Finish: <strong className="text-stone-600 font-extrabold">{project.completionDate}</strong></span>
      </div>

    </div>
  );
}
