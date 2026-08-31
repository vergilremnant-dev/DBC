import type { ProjectRecord } from '../../../pages/admin/AdminDashboard';

interface ProjectQuickActionsProps {
  project: ProjectRecord | null;
  onTabChange: (tabId: 'dashboard' | 'users' | 'verifications' | 'disputes' | 'content' | 'audit' | 'health' | 'marketplace' | 'projects') => void;
  onShowFlaggedOnly: () => void;
  onFlagProject: (id: string, name: string) => void;
}

export default function ProjectQuickActions({
  project,
  onTabChange,
  onShowFlaggedOnly,
  onFlagProject,
}: ProjectQuickActionsProps) {
  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none">
      <div>
        <h4 className="text-[10px] font-black uppercase text-stone-900 tracking-wider">
          Portfolio Shortcuts
        </h4>
        <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">
          Execute operations command actions
        </span>
      </div>

      <div className="grid gap-2 grid-cols-2 text-[9px] font-black uppercase tracking-wider text-center">
        <button
          onClick={onShowFlaggedOnly}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          ⚠️ Review Flagged
        </button>
        <button
          onClick={() => onTabChange('marketplace')}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          🛒 Marketplace
        </button>
        <button
          onClick={() => onTabChange('users')}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          👤 Manage Users
        </button>
        <button
          onClick={() => onTabChange('dashboard')}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          ⚡ Executive view
        </button>

        {project && !project.flagged && (
          <button
            onClick={() => onFlagProject(project.id, project.name)}
            className="col-span-2 w-full dbc-btn dbc-btn-sm dbc-btn-danger border border-rose-200 hover:bg-rose-100"
          >
            ⚠️ Flag Selected Project: {project.id}
          </button>
        )}
      </div>
    </div>
  );
}
