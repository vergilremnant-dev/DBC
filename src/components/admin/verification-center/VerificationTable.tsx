import StatusBadge from './StatusBadge';
import type { VerificationRequest } from '../../../pages/admin/AdminDashboard';

interface VerificationTableProps {
  requests: VerificationRequest[];
  onSelectRequest: (req: VerificationRequest) => void;
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function VerificationTable({
  requests,
  onSelectRequest,
  onApprove,
  onReject,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
}: VerificationTableProps) {
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="bg-white border border-light-border rounded-3xl shadow-apple-sm text-left select-none overflow-hidden flex flex-col justify-between">
      {/* Desktop view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Verification Center Backlog Table">
          <thead>
            <tr className="border-b border-light-border bg-stone-50/50 text-[9px] font-black uppercase text-stone-400">
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('id')}>
                Request ID{renderSortIndicator('id')}
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('name')}>
                Applicant{renderSortIndicator('name')}
              </th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('submittedDate')}>
                Submitted Date{renderSortIndicator('submittedDate')}
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Docs</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('lastUpdated')}>
                Last Updated{renderSortIndicator('lastUpdated')}
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-stone-50/30 transition-colors">
                {/* ID */}
                <td className="py-3 px-4 font-mono font-bold text-[10px] text-stone-500">
                  {req.id}
                </td>

                {/* Applicant */}
                <td className="py-3 px-4">
                  <strong 
                    className="block text-stone-900 hover:text-brand-emerald cursor-pointer"
                    onClick={() => onSelectRequest(req)}
                  >
                    {req.name}
                  </strong>
                  {req.businessName && <span className="block text-[8.5px] text-stone-450">{req.businessName}</span>}
                </td>

                {/* Role */}
                <td className="py-3 px-4">
                  <span className="bg-stone-100 text-stone-705 text-[8.5px] px-2 py-0.5 rounded font-black uppercase">
                    {req.role}
                  </span>
                </td>

                {/* Submitted Date */}
                <td className="py-3 px-4 text-stone-500 font-medium">
                  {req.submittedDate}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4">
                  <StatusBadge status={req.status} />
                </td>

                {/* Docs Submitted count */}
                <td className="py-3 px-4 text-center">
                  <span className="bg-stone-50 border border-stone-200 text-stone-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                    📂 {req.documentsSubmitted?.length || 0}
                  </span>
                </td>

                {/* Last Updated */}
                <td className="py-3 px-4 text-stone-500 font-medium">
                  {req.lastUpdated}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2.5 justify-end text-[9px] font-black uppercase tracking-wider">
                    <button
                      onClick={() => onSelectRequest(req)}
                      className="text-brand-emerald hover:underline focus:outline-none"
                    >
                      Review
                    </button>
                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onApprove(req.id, req.name)}
                          className="text-brand-emerald hover:underline focus:outline-none"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(req.id, req.name)}
                          className="text-rose-600 hover:underline focus:outline-none"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view stacked cards */}
      <div className="space-y-4 p-4 md:hidden">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-light-border p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-stone-400 font-bold">{req.id}</span>
              <StatusBadge status={req.status} />
            </div>
            <div>
              <strong 
                onClick={() => onSelectRequest(req)}
                className="text-xs text-stone-900 block cursor-pointer hover:text-brand-emerald"
              >
                {req.name}
              </strong>
              {req.businessName && <span className="text-[10px] text-stone-500 block mt-0.5">{req.businessName}</span>}
              <span className="bg-stone-50 border border-stone-150 text-[8px] font-black text-stone-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                {req.role}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>Submitted: {req.submittedDate}</span>
              <span>Updated: {req.lastUpdated}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => onSelectRequest(req)}
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
              >
                Review
              </button>
              {req.status === 'Pending' && (
                <>
                  <button
                    onClick={() => onApprove(req.id, req.name)}
                    className="dbc-btn dbc-btn-sm dbc-btn-primary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(req.id, req.name)}
                    className="dbc-btn dbc-btn-sm dbc-btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
export type { VerificationTableProps };
