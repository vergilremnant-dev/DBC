import { useNavigate } from 'react-router-dom';

interface SettingsQuickActionsProps {
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
}

export default function SettingsQuickActions({ onSave, onReset, isSaving }: SettingsQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Save Settings',
      icon: '💾',
      desc: 'Persist all configuration changes.',
      onClick: onSave,
      variant: 'primary',
    },
    {
      label: 'Reset Settings',
      icon: '↺',
      desc: 'Revert to last saved state.',
      onClick: onReset,
      variant: 'secondary',
    },
    {
      label: 'Manage Users',
      icon: '👥',
      desc: 'Go to User Management module.',
      onClick: () => navigate('/admin/dashboard'),
      variant: 'secondary',
    },
    {
      label: 'Verification Center',
      icon: '🛡️',
      desc: 'Review pending partner verifications.',
      onClick: () => navigate('/admin/dashboard'),
      variant: 'secondary',
    },
    {
      label: 'Reports Dashboard',
      icon: '📊',
      desc: 'View platform analytics and reports.',
      onClick: () => navigate('/admin/dashboard'),
      variant: 'secondary',
    },
  ];

  return (
    <aside
      className="bg-white border border-light-border rounded-3xl shadow-apple-sm overflow-hidden sticky top-24 self-start"
      aria-label="Quick actions"
    >
      <div className="px-5 py-4 border-b border-light-border">
        <h2 className="text-sm font-black text-stone-900 font-display">Quick Actions</h2>
        <p className="text-2xs text-stone-500 font-medium mt-0.5">Shortcuts and navigation.</p>
      </div>
      <div className="p-4 space-y-2">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={isSaving && (action.label === 'Save Settings' || action.label === 'Reset Settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald disabled:opacity-50 disabled:cursor-not-allowed
              ${action.variant === 'primary'
                ? 'bg-brand-emerald text-white hover:bg-brand-emerald/90 shadow-sm'
                : 'bg-stone-50 border border-light-border hover:bg-stone-100 text-stone-700'
              }`}
            aria-label={action.desc}
          >
            <span className="text-base shrink-0" aria-hidden="true">{action.icon}</span>
            <div className="min-w-0">
              <p className={`text-2xs font-black uppercase tracking-wider leading-snug ${action.variant === 'primary' ? 'text-white' : 'text-stone-700'}`}>
                {action.label}
              </p>
              <p className={`text-3xs font-medium leading-relaxed truncate ${action.variant === 'primary' ? 'text-white/90' : 'text-stone-500'}`}>
                {action.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
