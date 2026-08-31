import StatusBadge from './StatusBadge';
import type { MarketplaceRequirement } from '../../../pages/admin/AdminDashboard';

interface RequirementsTableProps {
  requirements: MarketplaceRequirement[];
  onSelectRequirement: (req: MarketplaceRequirement) => void;
  onHide: (id: string, title: string) => void;
  onUnhide: (id: string, title: string) => void;
  onCloseRequirement: (id: string, title: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RequirementsTable({
  requirements,
  onSelectRequirement,
  onHide,
  onUnhide,
  onCloseRequirement,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
}: RequirementsTableProps) {
  const formatBudget = (min: number, max: number) => {
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="bg-white border border-light-border rounded-3xl shadow-apple-sm text-left select-none overflow-hidden flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Marketplace Requirements Detailed Table">
          <thead>
            <tr className="border-b border-light-border bg-stone-50/50 text-[9px] font-black uppercase text-stone-400">
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('id')}>
                Req ID{renderSortIndicator('id')}
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('title')}>
                Title{renderSortIndicator('title')}
              </th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('budgetMax')}>
                Budget Range{renderSortIndicator('budgetMax')}
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('createdAt')}>
                Posted Date{renderSortIndicator('createdAt')}
              </th>
              <th className="py-3 px-4 text-center">Flags</th>
              <th className="py-3 px-4 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
            {requirements.map((req) => (
              <tr key={req.id} className="hover:bg-stone-50/30 transition-colors">
                {/* ID */}
                <td className="py-3 px-4 font-mono font-bold text-[10px] text-stone-500">
                  {req.id}
                </td>

                {/* Title */}
                <td className="py-3 px-4">
                  <strong 
                    className="block text-stone-900 hover:text-brand-emerald cursor-pointer"
                    onClick={() => onSelectRequirement(req)}
                  >
                    {req.title}
                  </strong>
                  {req.propertyType && <span className="block text-[8px] font-black uppercase tracking-wider text-stone-400">{req.propertyType}</span>}
                </td>

                {/* Customer */}
                <td className="py-3 px-4 text-stone-850">
                  {req.customerName}
                </td>

                {/* Category */}
                <td className="py-3 px-4">
                  <span className="bg-stone-100 text-stone-700 text-[8.5px] px-2 py-0.5 rounded font-black uppercase">
                    {req.category}
                  </span>
                </td>

                {/* Location */}
                <td className="py-3 px-4 text-stone-500">
                  {req.city}
                </td>

                {/* Budget */}
                <td className="py-3 px-4 text-stone-850">
                  {formatBudget(req.budgetMin, req.budgetMax)}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={req.status} />
                </td>

                {/* Posted Date */}
                <td className="py-3 px-4 text-stone-500 font-medium">
                  {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>

                {/* Flag Count */}
                <td className="py-3 px-4 text-center">
                  {req.reportCount > 0 ? (
                    <span className="bg-rose-50 text-rose-700 font-black px-2 py-0.5 rounded-full border border-rose-200 text-[8.5px]">
                      🚨 {req.reportCount}
                    </span>
                  ) : (
                    <span className="text-stone-300 font-medium">&mdash;</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2.5 justify-end text-[9px] font-black uppercase tracking-wider">
                    <button
                      onClick={() => onSelectRequirement(req)}
                      className="text-brand-emerald hover:underline focus:outline-none"
                    >
                      View
                    </button>
                    {req.status === 'Hidden' ? (
                      <button
                        onClick={() => onUnhide(req.id, req.title)}
                        className="text-brand-emerald hover:underline focus:outline-none"
                      >
                        Unhide
                      </button>
                    ) : (
                      <button
                        onClick={() => onHide(req.id, req.title)}
                        className="text-rose-600 hover:underline focus:outline-none"
                      >
                        Hide
                      </button>
                    )}
                    {req.status !== 'Closed' && (
                      <button
                        onClick={() => onCloseRequirement(req.id, req.title)}
                        className="text-stone-600 hover:underline focus:outline-none"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
export type { RequirementsTableProps };
