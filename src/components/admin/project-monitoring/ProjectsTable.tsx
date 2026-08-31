import StatusBadge from './StatusBadge';
import type { ProjectRecord } from '../../../pages/admin/AdminDashboard';

interface ProjectsTableProps {
  projects: ProjectRecord[];
  onSelectProject: (proj: ProjectRecord) => void;
  onFlagProject: (id: string, name: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ProjectsTable({
  projects,
  onSelectProject,
  onFlagProject,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
}: ProjectsTableProps) {
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="bg-white border border-light-border rounded-3xl shadow-apple-sm text-left select-none overflow-hidden flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Platform Projects Portfolio Table">
          <thead>
            <tr className="border-b border-light-border bg-stone-50/50 text-[9px] font-black uppercase text-stone-400">
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('id')}>
                Project ID{renderSortIndicator('id')}
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('name')}>
                Project Name{renderSortIndicator('name')}
              </th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Professional</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 cursor-pointer hover:text-stone-900" onClick={() => onSort('progress')}>
                Progress{renderSortIndicator('progress')}
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4 text-center">Alerts</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
            {projects.map((proj) => (
              <tr key={proj.id} className="hover:bg-stone-50/30 transition-colors">
                {/* Project ID */}
                <td className="py-3 px-4 font-mono font-bold text-[10px] text-stone-500">
                  {proj.id}
                </td>

                {/* Project Name */}
                <td className="py-3 px-4">
                  <strong 
                    className="block text-stone-900 hover:text-brand-emerald cursor-pointer"
                    onClick={() => onSelectProject(proj)}
                  >
                    {proj.name}
                  </strong>
                  {proj.address && <span className="block text-[8.5px] text-stone-400 font-bold uppercase tracking-wider">{proj.address}, {proj.city}</span>}
                </td>

                {/* Customer */}
                <td className="py-3 px-4 text-stone-850">
                  {proj.customerName}
                </td>

                {/* Professional */}
                <td className="py-3 px-4 text-stone-850">
                  {proj.professionalName}
                </td>

                {/* Category */}
                <td className="py-3 px-4">
                  <span className="bg-stone-100 text-stone-700 text-[8.5px] px-2 py-0.5 rounded font-black uppercase">
                    {proj.category}
                  </span>
                </td>

                {/* Progress bar */}
                <td className="py-3 px-4 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-850 shrink-0 w-8">{proj.progress}%</span>
                    <div className="w-full bg-stone-100 border border-stone-200 h-2 rounded-full overflow-hidden shrink-0 max-w-[80px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          proj.progress === 100 
                            ? 'bg-emerald-600' 
                            : proj.progress > 50 
                            ? 'bg-brand-emerald' 
                            : proj.progress > 25 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`} 
                        style={{ width: `${proj.progress}%` }} 
                      />
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={proj.status} />
                </td>

                {/* Dates */}
                <td className="py-3 px-4 text-[10px] text-stone-500">
                  <p>Start: {new Date(proj.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                  <p className="mt-0.5">End: {new Date(proj.expectedCompletion).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                </td>

                {/* Alert flag */}
                <td className="py-3 px-4 text-center">
                  {proj.flagged ? (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 font-black px-2 py-0.5 rounded-full text-[8.5px]" title={proj.flagReason}>
                      ⚠️ Flagged
                    </span>
                  ) : (
                    <span className="text-stone-300 font-medium">&mdash;</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2.5 justify-end text-[9px] font-black uppercase tracking-wider">
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="text-brand-emerald hover:underline focus:outline-none"
                    >
                      View
                    </button>
                    {!proj.flagged && (
                      <button
                        onClick={() => onFlagProject(proj.id, proj.name)}
                        className="text-rose-600 hover:underline focus:outline-none"
                      >
                        Flag
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
export type { ProjectsTableProps };
