import StatusBadge from './StatusBadge';
import type { UserRecord } from '../../../pages/admin/AdminDashboard';

interface UsersTableProps {
  users: UserRecord[];
  onSelectUser: (user: UserRecord) => void;
  onApprove: (id: string, name: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function UsersTable({
  users,
  onSelectUser,
  onApprove,
  onStatusChange,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
}: UsersTableProps) {
  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="bg-white border border-light-border rounded-3xl shadow-apple-sm text-left select-none overflow-hidden flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Platform Users Detailed Table">
          <thead>
            <tr className="border-b border-light-border bg-stone-50/50 text-[9px] font-black uppercase text-stone-400">
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('name')}>
                User Details{renderSortIndicator('name')}
              </th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Platform Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('joinedDate')}>
                Joined Date{renderSortIndicator('joinedDate')}
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('lastLogin')}>
                Last Login{renderSortIndicator('lastLogin')}
              </th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50/30 transition-colors">
                {/* User Details */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => onSelectUser(u)}
                      className="w-8 h-8 rounded-full bg-brand-emerald text-white text-xs font-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <strong 
                        className="block text-stone-900 hover:text-brand-emerald cursor-pointer"
                        onClick={() => onSelectUser(u)}
                      >
                        {u.name}
                      </strong>
                      <span className="block text-[8.5px] text-stone-400 font-bold uppercase tracking-wider">ID: {u.id}</span>
                      {u.companyName && <span className="block text-[9px] text-stone-500">{u.companyName}</span>}
                    </div>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="py-3 px-4">
                  <p className="text-stone-700">{u.email}</p>
                  <p className="text-[10px] text-stone-450 mt-0.5">{u.phone}</p>
                </td>

                {/* Platform Role */}
                <td className="py-3 px-4">
                  <span className="dbc-badge dbc-badge-progress text-[7.5px] py-0.5">{u.role}</span>
                </td>

                {/* Account Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={u.status} />
                </td>

                {/* Verification Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={u.verificationStatus} />
                </td>

                {/* Joined Date */}
                <td className="py-3 px-4 text-stone-500 font-medium">{u.joinedDate}</td>

                {/* Last Login */}
                <td className="py-3 px-4 text-stone-500 font-medium">{u.lastLogin}</td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2.5 justify-end">
                    <button
                      onClick={() => onSelectUser(u)}
                      className="text-[9px] font-black uppercase text-brand-emerald hover:underline focus:outline-none"
                    >
                      View
                    </button>
                    {u.status === 'Active' ? (
                      <button
                        onClick={() => onStatusChange(u.id, 'Suspended')}
                        className="text-[9px] font-bold uppercase text-rose-600 hover:underline focus:outline-none"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => onStatusChange(u.id, 'Active')}
                        className="text-[9px] font-bold uppercase text-brand-emerald hover:underline focus:outline-none"
                      >
                        Activate
                      </button>
                    )}
                    {u.verificationStatus === 'Pending' && (
                      <button
                        onClick={() => onApprove(u.id, u.name)}
                        className="text-[9px] font-black uppercase text-brand-emerald hover:underline focus:outline-none"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <footer className="p-4 border-t border-light-border bg-stone-50/50 flex justify-between items-center text-xs font-bold text-stone-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Next &rarr;
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
