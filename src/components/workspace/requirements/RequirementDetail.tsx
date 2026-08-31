import { useNavigate } from 'react-router-dom';
import { RequirementStatusBadge } from './RequirementStatusBadge';

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  address: string;
  createdAt: string;
  status: string;
  prosInterestedCount?: number;
}

interface RequirementDetailProps {
  requirement: Requirement;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function RequirementDetail({
  requirement,
  onClose,
  onEdit,
  onCancel,
  onDuplicate,
  onDelete,
}: RequirementDetailProps) {
  const navigate = useNavigate();
  const isDraft = requirement.status.trim().toLowerCase() === 'draft';
  const isOpen = requirement.status.trim().toLowerCase() === 'open';

  // Chronological timeline milestones mock
  const getTimelineMilestones = (status: string) => {
    const list = [
      { label: 'Draft Saved', date: new Date(requirement.createdAt).toLocaleDateString(), active: true },
      { label: 'Open Marketplace', date: 'Awaiting submission', active: false },
      { label: 'Quotation Review', date: 'Pending bids', active: false },
      { label: 'Project In Progress', date: 'Not started', active: false },
    ];

    const norm = status.toLowerCase().trim();
    if (norm !== 'draft') {
      list[1].active = true;
      list[1].date = new Date(requirement.createdAt).toLocaleDateString();
    }
    if (['under review', 'quoted', 'in progress', 'completed'].includes(norm)) {
      list[2].active = true;
      list[2].date = 'Updated recently';
    }
    if (['in progress', 'completed'].includes(norm)) {
      list[3].active = true;
      list[3].date = 'Operational active';
    }

    return list;
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-lg p-6 space-y-6 text-left transition duration-200">
      
      {/* Header and Close */}
      <div className="flex justify-between items-start gap-4 border-b border-stone-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900 font-serif">{requirement.title}</h3>
            <RequirementStatusBadge status={requirement.status} />
          </div>
          <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
            Ticket ID: {requirement.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 h-6 w-6 rounded-full hover:bg-stone-50 border border-stone-150 flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Category</span>
          <span className="block font-bold text-stone-700">{requirement.category}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Location</span>
          <span className="block font-bold text-stone-700">{requirement.city}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Budget Range</span>
          <span className="block font-bold text-stone-750">
            ₹{requirement.budgetMin.toLocaleString()} - ₹{requirement.budgetMax.toLocaleString()}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Date Created</span>
          <span className="block font-bold text-stone-700">
            {new Date(requirement.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="col-span-2 space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Detailed Address</span>
          <span className="block font-semibold text-stone-600 leading-relaxed">{requirement.address}</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5 border-t border-stone-100 pt-4">
        <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Project Scope</span>
        <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
          {requirement.description}
        </p>
      </div>

      {/* Attachments Placeholder */}
      <div className="space-y-2 border-t border-stone-100 pt-4">
        <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Uploaded Attachments</span>
        <div className="border border-dashed border-stone-200 rounded-xl p-3 bg-stone-50 text-center text-[10px] text-stone-400 font-semibold">
          No files uploaded.
        </div>
      </div>

      {/* Status Timeline */}
      <div className="space-y-3 border-t border-stone-100 pt-4">
        <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Progress Timeline</span>
        <div className="relative pl-4 space-y-3 border-l border-stone-150">
          {getTimelineMilestones(requirement.status).map((m, idx) => (
            <div key={idx} className="relative text-[10px] space-y-0.5">
              <div
                className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full border ${
                  m.active
                    ? 'bg-emerald-600 border-emerald-700 shadow-sm animate-pulse'
                    : 'bg-stone-100 border-stone-300'
                }`}
              />
              <span className={`block font-bold ${m.active ? 'text-stone-900' : 'text-stone-400'}`}>
                {m.label}
              </span>
              <span className="block text-[8px] text-stone-400 font-semibold">{m.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-stone-100 pt-4 flex flex-col gap-2 w-full">
        {isDraft && (
          <div className="flex gap-2 w-full">
            <button
              onClick={onEdit}
              className="dbc-btn dbc-btn-md dbc-btn-primary flex-1"
            >
              Continue Editing Draft
            </button>
            <button
              onClick={onDelete}
              className="dbc-btn dbc-btn-md dbc-btn-danger bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 flex-1"
            >
              Delete Draft
            </button>
          </div>
        )}

        {isOpen && (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => navigate(`/search?q=${encodeURIComponent(requirement.category)}`)}
              className="dbc-btn dbc-btn-md dbc-btn-primary w-full"
            >
              Explore Matching Partners
            </button>
            <div className="flex gap-2 w-full">
              <button
                onClick={onCancel}
                className="dbc-btn dbc-btn-md dbc-btn-danger bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 flex-1"
              >
                Cancel Requirement
              </button>
              <button
                onClick={onDuplicate}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 flex-1"
              >
                Duplicate
              </button>
            </div>
          </div>
        )}

        {!isDraft && !isOpen && (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={onDuplicate}
              className="dbc-btn dbc-btn-md dbc-btn-primary w-full"
            >
              Reopen / Duplicate Specifications
            </button>
            <button
              onClick={() => navigate('/')}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 w-full"
            >
              Explore Professionals
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
