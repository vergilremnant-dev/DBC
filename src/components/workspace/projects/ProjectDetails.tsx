import type { ProjectData } from './ProjectCard';
import { ProjectTimeline } from './ProjectTimeline';
import { MilestoneCard } from './MilestoneCard';

interface ProjectDetailsProps {
  project: ProjectData;
  onClose?: () => void;
  onToggleMilestone: (milestoneId: string) => void;
  onStatusChange: (status: 'Planning' | 'Scheduled' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled') => void;
}

export function ProjectDetails({
  project,
  onClose,
  onToggleMilestone,
  onStatusChange,
}: ProjectDetailsProps) {
  const statuses = ['Planning', 'Scheduled', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as const;

  return (
    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col justify-between text-left text-xs font-semibold text-stone-700">
      
      {/* Scrollable body */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Title row */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="bg-stone-50 border border-stone-200 text-stone-600 rounded px-2 py-0.5 text-3xs font-black uppercase">
              {project.category}
            </span>
            <h3 className="text-base font-bold text-stone-900 font-display leading-snug">
              {project.name}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-850 text-base font-bold cursor-pointer leading-none p-1 bg-stone-50 rounded-lg hover:bg-stone-100 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Client details / Timeline info */}
        <div className="grid grid-cols-2 gap-3 border-t border-b border-stone-100 py-4">
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Client / Customer</span>
            <strong className="text-stone-900 text-sm block mt-0.5">{project.customerName}</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Operational Priority</span>
            <strong className="text-rose-800 text-sm block mt-0.5">{project.priority}</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Start Date</span>
            <strong className="text-stone-700 block mt-0.5">{project.startDate}</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Completion Target</span>
            <strong className="text-stone-700 block mt-0.5">{project.completionDate}</strong>
          </div>
        </div>

        {/* Timeline path widget */}
        <ProjectTimeline progress={project.progress} />

        {/* Milestone Card checklist */}
        <MilestoneCard
          milestones={project.milestones}
          onToggleMilestone={onToggleMilestone}
        />

        {/* Client notes placeholder */}
        <div className="space-y-2 bg-stone-50 border border-stone-150 rounded-xl p-3">
          <span className="block text-3xs uppercase font-bold text-stone-400">Site Coordinator Logs</span>
          <p className="text-2xs text-stone-500 font-semibold leading-relaxed">
            Measurements checklist is complete. Concrete cement levels have been verified at site boundaries.
          </p>
        </div>

        {/* Attachments blueprint files */}
        <div className="space-y-2">
          <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
            Contract Blueprints & Estimates (2)
          </span>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="text-base">📄</span>
                <span className="text-2xs font-bold text-stone-750">Villa_Wiring_Blueprints.pdf</span>
              </div>
              <button
                onClick={() => alert('Downloaded layout blueprints')}
                className="text-3xs font-black uppercase text-emerald-800"
              >
                Get File
              </button>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="text-base">📄</span>
                <span className="text-2xs font-bold text-stone-750">Final_Inspection_Signoff.pdf</span>
              </div>
              <button
                onClick={() => alert('Downloaded signoff verification')}
                className="text-3xs font-black uppercase text-emerald-800"
              >
                Get File
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Persistent Status Control Panel */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-stone-500">
        <div className="flex items-center gap-2">
          <span>Status Update</span>
          <select
            value={project.status}
            onChange={(e) => onStatusChange(e.target.value as (typeof statuses)[number])}
            className="border border-stone-200 rounded bg-white px-2 py-1 text-stone-850 focus:outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => alert('Summary exported in CSV layout!')}
          className="rounded-lg bg-stone-900 hover:bg-stone-850 px-3 py-1.5 text-3xs font-black text-white uppercase tracking-wider cursor-pointer shadow-sm"
        >
          Export Summary
        </button>
      </div>

    </div>
  );
}
