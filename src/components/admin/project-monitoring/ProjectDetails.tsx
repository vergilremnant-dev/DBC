import StatusBadge from './StatusBadge';
import type { ProjectRecord } from '../../../pages/admin/AdminDashboard';

interface ProjectDetailsProps {
  project: ProjectRecord | null;
  onClose: () => void;
  onFlagProject: (id: string, name: string) => void;
}

export default function ProjectDetails({
  project,
  onClose,
  onFlagProject,
}: ProjectDetailsProps) {
  if (!project) {
    return (
      <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-2.5 shadow-apple-sm text-stone-450 h-full flex flex-col justify-center select-none">
        <span className="text-3xl">💼</span>
        <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Select a Project</h4>
        <p className="text-[10px] text-stone-500 font-medium">Click on a project row or card to load the read-only monitoring inspector.</p>
      </div>
    );
  }

  return (
    <aside className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left relative select-none max-h-[720px] overflow-y-auto">
      {/* Header detail */}
      <div className="flex justify-between items-start border-b border-light-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-400 font-bold">{project.id}</span>
            <StatusBadge status={project.status} />
          </div>
          <h3 className="text-xs font-black text-stone-900 mt-1 leading-snug">{project.name}</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-stone-400 hover:text-stone-900 text-sm transition focus:outline-none"
          aria-label="Close details inspector"
        >
          ✕
        </button>
      </div>

      {/* Flag Alert */}
      {project.flagged && (
        <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl text-[10px] font-semibold text-rose-900 space-y-1">
          <p>⚠️ <strong>Flagged for Review:</strong> {project.flagReason}</p>
        </div>
      )}

      {/* Info Sections */}
      <div className="space-y-4 text-xs font-semibold text-stone-600">
        {/* Project Scope */}
        <div className="space-y-1">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Project Scope Statement
          </span>
          <p className="text-[10px] text-stone-700 font-medium leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-200">
            {project.scope || 'No explicit scope statement detailed.'}
          </p>
        </div>

        {/* Stakeholder summaries */}
        <div>
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider mb-2">
            Stakeholder Directory Details
          </span>
          <div className="space-y-2">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Customer Owner:</span> <strong className="text-stone-900">{project.customerName}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Professional Contractor:</span> <strong className="text-stone-900">{project.professionalName}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Trade Category:</span> <strong className="text-stone-900">{project.category}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Execution progress:</span> <strong className="text-stone-900">{project.progress}%</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Last updated check:</span> <strong className="text-stone-900">{project.lastUpdated}</strong>
            </p>
            <p className="flex justify-between">
              <span>Coordinates address:</span> <strong className="text-stone-900">{project.address}, {project.city}</strong>
            </p>
          </div>
        </div>

        {/* Milestones checklists */}
        <div className="space-y-2">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Execution Milestones Checklist
          </span>
          {project.milestones && project.milestones.length > 0 ? (
            <div className="space-y-1.5">
              {project.milestones.map((m) => (
                <div 
                  key={m.id} 
                  className="flex justify-between items-center bg-stone-50 border border-stone-150 p-2 rounded-xl text-[10px]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      m.status === 'Completed' ? 'bg-emerald-500' : m.status === 'In Progress' ? 'bg-blue-500' : 'bg-stone-300'
                    }`} />
                    <span className="font-semibold text-stone-850">{m.name}</span>
                  </div>
                  <span className="text-[8.5px] font-bold uppercase text-stone-450">{m.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9.5px] text-stone-450 italic">No milestones defined.</p>
          )}
        </div>

        {/* Task Summary */}
        <div className="space-y-1.5">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Execution Tasks Summary
          </span>
          <div className="flex justify-between text-[10px] text-stone-750 font-bold border-b border-light-border/40 pb-1.5">
            <span>Completed Tasks:</span>
            <span>{project.completedTasksCount || 0} / {project.tasksCount || 0} Tasks</span>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="space-y-2">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Contract Documents & Invoices
          </span>
          {project.documents && project.documents.length > 0 ? (
            <div className="space-y-1.5">
              {project.documents.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center bg-stone-50 border border-stone-150 p-2 rounded-xl text-[10px]">
                  <span className="truncate max-w-[200px] text-stone-750">📄 {doc}</span>
                  <button 
                    onClick={() => alert(`Simulating invoice/agreement download for: ${doc}`)}
                    className="text-brand-emerald hover:underline text-[9.5px] font-black"
                  >
                    View File
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9.5px] text-stone-450 italic">No uploaded documents.</p>
          )}
        </div>
      </div>

      {/* Admin Flagging Control */}
      {!project.flagged && (
        <div className="pt-4 border-t border-light-border">
          <button
            onClick={() => onFlagProject(project.id, project.name)}
            className="w-full dbc-btn dbc-btn-md dbc-btn-danger border border-rose-200 hover:bg-rose-100"
          >
            ⚠️ Flag Project for Admin Review
          </button>
        </div>
      )}
    </aside>
  );
}
