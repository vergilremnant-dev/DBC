import StatusBadge from './StatusBadge';
import type { UserRecord } from '../../../pages/admin/AdminDashboard';

interface UserCardProps {
  user: UserRecord;
  onSelectUser: (user: UserRecord) => void;
  onApprove: (id: string, name: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export default function UserCard({
  user,
  onSelectUser,
  onApprove,
  onStatusChange,
}: UserCardProps) {
  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-shadow flex flex-col justify-between gap-4 text-left select-none md:hidden">
      <div className="flex gap-3.5 items-start">
        <div 
          onClick={() => onSelectUser(user)}
          className="w-10 h-10 rounded-full bg-brand-emerald text-white text-xs font-black flex items-center justify-center cursor-pointer shrink-0"
        >
          {getInitials(user.name)}
        </div>
        
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <strong 
              onClick={() => onSelectUser(user)}
              className="text-xs font-black text-stone-900 hover:text-brand-emerald cursor-pointer truncate"
            >
              {user.name}
            </strong>
            <span className="bg-stone-100 text-stone-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-[11px] text-stone-700 truncate">{user.email}</p>
          <p className="text-[10px] text-stone-450">{user.phone}</p>
          {user.companyName && <p className="text-[10px] text-stone-500">{user.companyName}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <StatusBadge status={user.status} />
        <StatusBadge status={user.verificationStatus} />
      </div>

      <div className="border-t border-light-border/40 pt-3.5 flex justify-between items-center gap-2 text-[9px] font-black uppercase tracking-wider">
        <div className="text-[8.5px] text-stone-450 font-bold">
          Joined: {user.joinedDate}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onSelectUser(user)}
            className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
          >
            Details
          </button>
          
          {user.status === 'Active' ? (
            <button
              onClick={() => onStatusChange(user.id, 'Suspended')}
              className="dbc-btn dbc-btn-sm dbc-btn-danger"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(user.id, 'Active')}
              className="dbc-btn dbc-btn-sm dbc-btn-primary"
            >
              Activate
            </button>
          )}

          {user.verificationStatus === 'Pending' && (
            <button
              onClick={() => onApprove(user.id, user.name)}
              className="dbc-btn dbc-btn-sm dbc-btn-primary"
            >
              Verify
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
