import StatusBadge from './StatusBadge';
import type { MarketplaceRequirement } from '../../../pages/admin/AdminDashboard';

interface RequirementCardProps {
  requirement: MarketplaceRequirement;
  onSelectRequirement: (req: MarketplaceRequirement) => void;
  onHide: (id: string, title: string) => void;
  onUnhide: (id: string, title: string) => void;
  onCloseRequirement: (id: string, title: string) => void;
}

export default function RequirementCard({
  requirement,
  onSelectRequirement,
  onHide,
  onUnhide,
  onCloseRequirement,
}: RequirementCardProps) {
  const formatBudget = (min: number, max: number) => {
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-shadow flex flex-col justify-between gap-4 text-left select-none md:hidden">
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-2xs font-mono text-stone-400 font-bold shrink-0">
            {requirement.id}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {requirement.reportCount > 0 && (
              <span className="bg-rose-50 border border-rose-100 text-rose-700 text-3xs font-black px-1.5 py-0.5 rounded uppercase">
                🚨 Flagged: {requirement.reportCount}
              </span>
            )}
            <StatusBadge status={requirement.status} />
          </div>
        </div>

        <div className="space-y-1.5">
          <strong 
            onClick={() => onSelectRequirement(requirement)}
            className="text-xs font-black text-stone-900 hover:text-brand-emerald cursor-pointer block leading-snug"
          >
            {requirement.title}
          </strong>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs text-stone-500 font-semibold">
            <p>👤 Owner: <span className="text-stone-750">{requirement.customerName}</span></p>
            <p>📂 Type: <span className="text-stone-750">{requirement.propertyType || 'Residential'}</span></p>
            <p>📋 Category: <span className="text-stone-750">{requirement.category}</span></p>
            <p>📍 City: <span className="text-stone-750">{requirement.city}</span></p>
          </div>

          <div className="pt-1.5 flex justify-between items-center text-2xs font-bold text-stone-850 bg-stone-50/50 p-2 rounded-lg border border-stone-150">
            <span>Budget range:</span>
            <strong>{formatBudget(requirement.budgetMin, requirement.budgetMax)}</strong>
          </div>
        </div>
      </div>

      <div className="border-t border-light-border/40 pt-3.5 flex justify-between items-center text-3xs font-black uppercase tracking-wider">
        <span className="text-3xs text-stone-400 font-bold">
          Posted: {new Date(requirement.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => onSelectRequirement(requirement)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-lg text-stone-700 font-bold focus:outline-none"
          >
            Inspect
          </button>
          
          {requirement.status === 'Hidden' ? (
            <button
              onClick={() => onUnhide(requirement.id, requirement.title)}
              className="px-2.5 py-1.5 bg-brand-emerald hover:bg-emerald-800 text-white rounded-lg font-black focus:outline-none"
            >
              Unhide
            </button>
          ) : (
            <button
              onClick={() => onHide(requirement.id, requirement.title)}
              className="px-2.5 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold focus:outline-none"
            >
              Hide
            </button>
          )}

          {requirement.status !== 'Closed' && (
            <button
              onClick={() => onCloseRequirement(requirement.id, requirement.title)}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold focus:outline-none"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export type { RequirementCardProps };
