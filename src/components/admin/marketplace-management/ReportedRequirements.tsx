import type { MarketplaceRequirement } from '../../../pages/admin/AdminDashboard';

interface ReportedRequirementsProps {
  reportedItems: MarketplaceRequirement[];
  onSelectRequirement: (req: MarketplaceRequirement) => void;
  onDismissReport: (id: string, title: string) => void;
  onHideRequirement: (id: string, title: string) => void;
  onCloseRequirement: (id: string, title: string) => void;
}

export default function ReportedRequirements({
  reportedItems,
  onSelectRequirement,
  onDismissReport,
  onHideRequirement,
  onCloseRequirement,
}: ReportedRequirementsProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left select-none">
      <div className="border-b border-light-border/40 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
            🚨 Flagged Moderation Queue
          </h3>
          <p className="text-2xs text-stone-500 font-medium mt-0.5">
            Review user flags, report reasons, and copyright/spam concerns.
          </p>
        </div>
        {reportedItems.length > 0 && (
          <span className="bg-rose-50 text-rose-700 border border-rose-250 text-3xs font-black px-2.5 py-0.5 rounded-full uppercase">
            {reportedItems.length} Reports
          </span>
        )}
      </div>

      {reportedItems.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
          All clean! There are no flagged or reported listings pending moderator review.
        </div>
      ) : (
        <div className="space-y-4">
          {reportedItems.map((item) => (
            <div 
              key={item.id} 
              className="p-4 bg-rose-50/20 border border-rose-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-rose-300 transition-colors"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 
                    onClick={() => onSelectRequirement(item)}
                    className="text-xs font-black text-stone-900 cursor-pointer hover:underline truncate"
                  >
                    {item.title}
                  </h4>
                  <span className="bg-rose-50 border border-rose-100 text-3xs font-black px-1.5 py-0.5 rounded-full uppercase text-rose-800 tracking-wider">
                    {item.id}
                  </span>
                </div>
                
                <div className="text-2xs text-stone-650 font-semibold space-y-1">
                  <p className="text-rose-900 bg-rose-50/30 p-2 rounded-lg border border-rose-100">
                    ⚠️ <strong>Report Reason:</strong> {item.reportReason || 'Unacceptable content / spam description.'}
                  </p>
                  <div className="flex gap-4 text-3xs text-stone-450 font-bold uppercase mt-1">
                    <span>Flagged By: {item.reportedBy || 'User'}</span>
                    <span>Date: {item.reportDate || '03 Aug 2026'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end text-3xs font-black uppercase tracking-wider">
                <button
                  onClick={() => onSelectRequirement(item)}
                  className="px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-lg transition"
                >
                  Review Details
                </button>
                <button
                  onClick={() => onDismissReport(item.id, item.title)}
                  className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-800 text-white rounded-lg transition"
                >
                  Dismiss Report
                </button>
                <button
                  onClick={() => onHideRequirement(item.id, item.title)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition"
                >
                  Hide Listing
                </button>
                <button
                  onClick={() => onCloseRequirement(item.id, item.title)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition"
                >
                  Close Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
