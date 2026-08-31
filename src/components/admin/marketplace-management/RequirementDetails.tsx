import StatusBadge from './StatusBadge';
import type { MarketplaceRequirement } from '../../../pages/admin/AdminDashboard';

interface RequirementDetailsProps {
  requirement: MarketplaceRequirement | null;
  onClose: () => void;
  onHide: (id: string, title: string) => void;
  onUnhide: (id: string, title: string) => void;
  onCloseRequirement: (id: string, title: string) => void;
  onReopen: (id: string, title: string) => void;
  onDismissReports?: (id: string, title: string) => void;
}

export default function RequirementDetails({
  requirement,
  onClose,
  onHide,
  onUnhide,
  onCloseRequirement,
  onReopen,
  onDismissReports,
}: RequirementDetailsProps) {
  if (!requirement) {
    return (
      <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-2.5 shadow-apple-sm text-stone-450 h-full flex flex-col justify-center select-none">
        <span className="text-3xl">📋</span>
        <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Select a Listing</h4>
        <p className="text-[10px] text-stone-500 font-medium">Click on a requirement row or card to load the listing moderator detail panel.</p>
      </div>
    );
  }

  const formatBudget = (min: number, max: number) => {
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  };

  return (
    <aside className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left relative select-none max-h-[700px] overflow-y-auto">
      {/* Header detail */}
      <div className="flex justify-between items-start border-b border-light-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-400 font-bold">{requirement.id}</span>
            <StatusBadge status={requirement.status} />
          </div>
          <h3 className="text-xs font-black text-stone-900 mt-1 leading-snug">{requirement.title}</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-stone-400 hover:text-stone-900 text-sm transition focus:outline-none"
          aria-label="Close details inspector"
        >
          ✕
        </button>
      </div>

      {/* Info Sections */}
      <div className="space-y-4 text-xs font-semibold text-stone-600">
        {/* Basic description */}
        <div className="space-y-1">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Requirement Description
          </span>
          <p className="text-[10px] text-stone-700 font-medium leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
            {requirement.description}
          </p>
        </div>

        {/* Project info parameters */}
        <div>
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider mb-2">
            Project Listing Specifications
          </span>
          <div className="space-y-2">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Customer:</span> <strong className="text-stone-900">{requirement.customerName}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Trade Category:</span> <strong className="text-stone-900">{requirement.category}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Property Type:</span> <strong className="text-stone-900">{requirement.propertyType || 'Residential'}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Budget Estimate:</span> <strong className="text-stone-900">{formatBudget(requirement.budgetMin, requirement.budgetMax)}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Timeline:</span> <strong className="text-stone-900">{requirement.timeline || 'Immediate'}</strong>
            </p>
            <p className="flex justify-between">
              <span>Location Coordinates:</span> <strong className="text-stone-900">{requirement.address}, {requirement.city}</strong>
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Government Documents & Drafts
          </span>
          {requirement.documents && requirement.documents.length > 0 ? (
            <div className="space-y-1.5">
              {requirement.documents.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center bg-stone-50 border border-stone-150 p-2 rounded-xl text-[10px]">
                  <span className="truncate max-w-[200px] text-stone-750">📄 {doc}</span>
                  <button 
                    onClick={() => alert(`Simulating download for: ${doc}`)}
                    className="text-brand-emerald hover:underline text-[9.5px] font-black"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9.5px] text-stone-400 italic">No document attachments uploaded.</p>
          )}
        </div>

        {/* Reports Flagged Details */}
        {requirement.status === 'Reported' && (
          <div className="bg-rose-50/50 border border-rose-200 p-3.5 rounded-xl space-y-2">
            <span className="block text-[8.5px] font-black uppercase text-rose-700 tracking-wider">
              🚨 Active User Abuse Flag Details
            </span>
            <div className="text-[10px] font-semibold text-rose-900 space-y-1">
              <p>Reason: <span className="font-medium text-stone-800">{requirement.reportReason || 'Spam details.'}</span></p>
              <p>Reporter: <span className="font-medium text-stone-800">{requirement.reportedBy || 'Anoymous User'}</span></p>
              <p>Flagged Date: <span className="font-medium text-stone-800">{requirement.reportDate || '03 Aug 2026'}</span></p>
            </div>
            {onDismissReports && (
              <button
                onClick={() => onDismissReports(requirement.id, requirement.title)}
                className="w-full mt-1.5 dbc-btn dbc-btn-sm dbc-btn-secondary border border-rose-200 text-rose-700 hover:bg-stone-50"
              >
                Dismiss Flag Reports
              </button>
            )}
          </div>
        )}
      </div>

      {/* Moderation Controls Actions */}
      <div className="pt-4 border-t border-light-border space-y-2">
        <span className="block text-[8.5px] font-black uppercase text-stone-850 tracking-wider">
          Marketplace Moderation Commands
        </span>

        <div className="flex flex-col gap-2">
          {requirement.status === 'Hidden' ? (
            <button
              onClick={() => onUnhide(requirement.id, requirement.title)}
              className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Unhide &amp; Publish Listing
            </button>
          ) : (
            <button
              onClick={() => onHide(requirement.id, requirement.title)}
              className="w-full dbc-btn dbc-btn-md dbc-btn-danger"
            >
              Hide Listing (Moderate Visibility)
            </button>
          )}

          {requirement.status === 'Closed' ? (
            <button
              onClick={() => onReopen(requirement.id, requirement.title)}
              className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Reopen Requirement Listing
            </button>
          ) : (
            <button
              onClick={() => onCloseRequirement(requirement.id, requirement.title)}
              className="w-full dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Close Requirement Listing
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
