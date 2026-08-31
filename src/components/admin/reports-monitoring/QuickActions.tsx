import type { AdminTab } from '../../../pages/admin/AdminDashboard';

interface QuickActionsProps {
  onTabSelect: (tab: AdminTab) => void;
  onExport: () => void;
}

export default function QuickActions({ onTabSelect, onExport }: QuickActionsProps) {
  const actions = [
    { label: '👥 Manage Users', onClick: () => onTabSelect('users'), desc: 'Audit role authorizations' },
    { label: '🛒 Review Marketplace', onClick: () => onTabSelect('marketplace'), desc: 'Review flagged listings' },
    { label: '⏳ Open Verification Center', onClick: () => onTabSelect('verifications'), desc: 'Approve provider credentials' },
    { label: '💼 View Projects', onClick: () => onTabSelect('projects'), desc: 'Monitor active progress' },
  ];

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-left select-none space-y-4">
      <div>
        <h4 className="text-[10px] font-black uppercase text-stone-900 tracking-wider">
          ⚡ Administrative Quick Shortcuts
        </h4>
        <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">
          Access specific dashboard operations
        </span>
      </div>

      <div className="grid gap-3 grid-cols-2 text-xs font-semibold">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={act.onClick}
            className="p-3 border border-light-border rounded-xl text-left bg-stone-50 hover:bg-stone-100 transition-colors flex flex-col justify-between h-20 text-stone-850 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
          >
            <span className="font-bold text-[10px] uppercase tracking-wider">{act.label}</span>
            <span className="text-[8.5px] text-stone-450 font-medium block mt-1">{act.desc}</span>
          </button>
        ))}

        <button
          onClick={onExport}
          className="col-span-2 w-full dbc-btn dbc-btn-md dbc-btn-primary"
        >
          📤 Export platform activity summary report
        </button>
      </div>
    </div>
  );
}
export type { QuickActionsProps };
