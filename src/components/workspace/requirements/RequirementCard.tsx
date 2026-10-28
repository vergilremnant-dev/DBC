import { RequirementStatusBadge } from './RequirementStatusBadge';

interface Requirement {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  address: string;
  createdAt: string;
  status: string;
  prosInterestedCount?: number;
}

interface RequirementCardProps {
  requirement: Requirement;
  onSelect: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  const getProgressWidth = (status: string) => {
    const norm = status.toLowerCase().trim();
    if (norm === 'draft') return 'w-1/6 bg-stone-400';
    if (norm === 'open') return 'w-2/6 bg-emerald-500';
    if (norm === 'under review') return 'w-3/6 bg-blue-500';
    if (norm === 'quoted') return 'w-4/6 bg-purple-500';
    if (norm === 'in progress') return 'w-5/6 bg-amber-500';
    if (norm === 'completed') return 'w-full bg-sky-500';
    return 'w-0 bg-transparent';
  };

  return (
    <div
      onClick={onSelect}
      className="bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 text-left cursor-pointer flex flex-col justify-between gap-4 group"
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-0.5 min-w-0">
            <h4 className="text-xs font-black text-stone-900 leading-snug group-hover:text-emerald-800 transition truncate">
              {requirement.title}
            </h4>
            <span className="inline-block text-3xs font-black uppercase bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded">
              {requirement.category}
            </span>
          </div>
          <RequirementStatusBadge status={requirement.status} />
        </div>

        <p className="text-2xs text-stone-500 font-semibold leading-relaxed line-clamp-2">
          Budget: ₹{requirement.budgetMin.toLocaleString()} - ₹{requirement.budgetMax.toLocaleString()} • Location: {requirement.city}
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Progress Bar indicator */}
        <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${getProgressWidth(requirement.status)}`} />
        </div>

        <div className="flex justify-between items-center text-3xs font-bold text-stone-400 uppercase tracking-wider">
          <span>Created: {new Date(requirement.createdAt).toLocaleDateString()}</span>
          <span>
            {requirement.prosInterestedCount || 0} interested pros
          </span>
        </div>
      </div>
    </div>
  );
}
