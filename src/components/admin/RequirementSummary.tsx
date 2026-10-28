interface RequirementSummaryProps {
  openCount: number;
  closedCount: number;
  reportedCount: number;
  pendingReviewCount: number;
  onViewMarketplace: () => void;
}

export default function RequirementSummary({
  openCount,
  closedCount,
  reportedCount,
  pendingReviewCount,
  onViewMarketplace,
}: RequirementSummaryProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-5 text-left select-none">
      <div className="flex justify-between items-center border-b border-light-border/40 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
            Marketplace Requirements Summary
          </h3>
          <p className="text-2xs text-stone-500 font-medium mt-0.5">
            Active leads, closed opportunities, and moderation reviews.
          </p>
        </div>
        <button
          onClick={onViewMarketplace}
          className="text-3xs font-black uppercase text-brand-emerald hover:underline cursor-pointer focus:outline-none"
        >
          View Marketplace &rarr;
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-stone-700">
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
          <span className="block text-3xs font-black text-stone-400 uppercase tracking-wider">
            Open
          </span>
          <span className="text-base font-extrabold text-stone-900">{openCount}</span>
        </div>
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
          <span className="block text-3xs font-black text-stone-400 uppercase tracking-wider">
            Closed
          </span>
          <span className="text-base font-extrabold text-stone-900">{closedCount}</span>
        </div>
        <div className="p-3 bg-rose-50/50 border border-rose-150 rounded-xl">
          <span className="block text-3xs font-black text-rose-500 uppercase tracking-wider">
            Reported
          </span>
          <span className="text-base font-extrabold text-rose-700">{reportedCount}</span>
        </div>
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
          <span className="block text-3xs font-black text-amber-500 uppercase tracking-wider">
            Pending Review
          </span>
          <span className="text-base font-extrabold text-amber-700">{pendingReviewCount}</span>
        </div>
      </div>
    </div>
  );
}
