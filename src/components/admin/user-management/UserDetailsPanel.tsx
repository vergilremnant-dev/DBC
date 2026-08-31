import StatusBadge from './StatusBadge';
import type { UserRecord } from '../../../pages/admin/AdminDashboard';

interface UserDetailsPanelProps {
  user: UserRecord | null;
  onClose: () => void;
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  currentAdminEmail: string; // Used to prevent deactivating self!
}

export default function UserDetailsPanel({
  user,
  onClose,
  onApprove,
  onReject,
  onStatusChange,
  currentAdminEmail,
}: UserDetailsPanelProps) {
  if (!user) {
    return (
      <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-2.5 shadow-apple-sm text-stone-450 h-full flex flex-col justify-center select-none">
        <span className="text-3xl">👤</span>
        <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Select a User</h4>
        <p className="text-[10px] text-stone-500 font-medium">Click on a user profile to view detailed diagnostics and management actions.</p>
      </div>
    );
  }

  const isSelf = user.email.toLowerCase() === currentAdminEmail.toLowerCase();

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  const handleDeactivate = () => {
    if (isSelf) {
      alert("Self Safeguard: You cannot deactivate or suspend your own administrator account.");
      return;
    }
    onStatusChange(user.id, 'Inactive');
  };

  const handleSuspend = () => {
    if (isSelf) {
      alert("Self Safeguard: You cannot deactivate or suspend your own administrator account.");
      return;
    }
    onStatusChange(user.id, 'Suspended');
  };

  // Mock numbers based on role
  const getMockMetrics = (role: string) => {
    if (role === 'Customer') {
      return { projects: 3, requirements: 5 };
    } else if (role === 'Professional' || role === 'Consultant') {
      return { projects: 12, requirements: 0 };
    }
    return { projects: 0, requirements: 0 };
  };

  const metrics = getMockMetrics(user.role);

  return (
    <aside className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left relative select-none max-h-[650px] overflow-y-auto">
      {/* Header detail */}
      <div className="flex justify-between items-start border-b border-light-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-emerald text-white font-black flex items-center justify-center text-sm uppercase shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <h3 className="text-xs font-black text-stone-900 leading-none">{user.name}</h3>
            <span className="text-[9px] text-stone-400 font-bold uppercase block mt-1">User ID: {user.id}</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-stone-400 hover:text-stone-900 text-sm transition focus:outline-none"
          aria-label="Close user details drawer"
        >
          ✕
        </button>
      </div>

      {/* Account Info list */}
      <div className="space-y-4">
        <div>
          <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider mb-2">
            Identity & Role Details
          </span>
          <div className="space-y-2 text-xs font-semibold text-stone-600">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Full Name:</span> <strong className="text-stone-900">{user.name}</strong>
            </p>
            {user.companyName && (
              <p className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Business/Company:</span> <strong className="text-stone-900">{user.companyName}</strong>
              </p>
            )}
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Primary Role:</span> 
              <span className="bg-stone-100 text-stone-750 text-[8.5px] px-2 py-0.5 rounded font-black uppercase">
                {user.role}
              </span>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Account Status:</span> <StatusBadge status={user.status} />
            </p>
            <p className="flex justify-between">
              <span>Verification status:</span> <StatusBadge status={user.verificationStatus} />
            </p>
          </div>
        </div>

        <div>
          <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider mb-2">
            Contact Credentials
          </span>
          <div className="space-y-2 text-xs font-semibold text-stone-600">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Email coordinates:</span> <strong className="text-stone-900">{user.email}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Phone contact:</span> <strong className="text-stone-900">{user.phone}</strong>
            </p>
            <p className="flex justify-between">
              <span>City Location:</span> <strong className="text-stone-900">{user.location || 'Hyderabad'}</strong>
            </p>
          </div>
        </div>

        <div>
          <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider mb-2">
            Platform Metrics & Activity
          </span>
          <div className="space-y-2 text-xs font-semibold text-stone-600">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Active Projects Count:</span> <strong className="text-stone-900">{metrics.projects}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Marketplace Requirements:</span> <strong className="text-stone-900">{metrics.requirements}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Registration Date:</span> <strong className="text-stone-900">{user.joinedDate}</strong>
            </p>
            <p className="flex justify-between">
              <span>Last Session Login:</span> <strong className="text-stone-900">{user.lastLogin}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Account Operations CTA */}
      <div className="pt-4 border-t border-light-border space-y-3">
        <span className="block text-[8.5px] font-black uppercase text-stone-850 tracking-wider">
          IAM Management Actions
        </span>

        <div className="flex flex-col gap-2">
          {user.status !== 'Active' ? (
            <button
              onClick={() => onStatusChange(user.id, 'Active')}
              className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Reactivate / Activate Account
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDeactivate}
                disabled={isSelf}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Deactivate
              </button>
              <button
                onClick={handleSuspend}
                disabled={isSelf}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-danger"
              >
                Suspend
              </button>
            </div>
          )}

          {user.verificationStatus === 'Pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(user.id, user.name)}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Approve Verify
              </button>
              <button
                onClick={() => onReject(user.id, user.name)}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-danger bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700"
              >
                Decline Request
              </button>
            </div>
          )}

          <button
            onClick={() => alert(`Password reset coordinates link generated for: ${user.email}`)}
            className="w-full dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            Reset password link
          </button>
          
          <button
            onClick={() => alert('Opening public provider catalog page preview...')}
            className="w-full dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            View Public Profile Preview &rarr;
          </button>
        </div>
      </div>
    </aside>
  );
}
