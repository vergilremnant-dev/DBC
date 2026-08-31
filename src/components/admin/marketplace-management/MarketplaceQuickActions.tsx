import type { MarketplaceRequirement } from '../../../pages/admin/AdminDashboard';

interface MarketplaceQuickActionsProps {
  requirement: MarketplaceRequirement | null;
  onSelectRequirement: (req: MarketplaceRequirement) => void;
  onHide: (id: string, title: string) => void;
  onCloseRequirement: (id: string, title: string) => void;
  onReopen: (id: string, title: string) => void;
  onShowReportedOnly: () => void;
}

export default function MarketplaceQuickActions({
  requirement,
  onSelectRequirement,
  onHide,
  onCloseRequirement,
  onReopen,
  onShowReportedOnly,
}: MarketplaceQuickActionsProps) {
  if (!requirement) {
    return (
      <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-center text-[10px] text-stone-400 font-medium select-none">
        No active listing selected for quick moderation commands.
      </div>
    );
  }

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none">
      <div>
        <h4 className="text-[10px] font-black uppercase text-stone-900 tracking-wider">
          Listing Commands: {requirement.id}
        </h4>
        <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">
          Owner: {requirement.customerName} &bull; Status: {requirement.status}
        </span>
      </div>

      <div className="grid gap-2 grid-cols-2 text-[9px] font-black uppercase tracking-wider text-center">
        <button
          onClick={() => onSelectRequirement(requirement)}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          🔍 Inspect Details
        </button>
        <button
          onClick={onShowReportedOnly}
          className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          🚨 Review Reports
        </button>
        {requirement.status === 'Hidden' ? (
          <button
            disabled
            className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary border border-light-border opacity-50 cursor-not-allowed"
          >
            ✓ Hidden Status
          </button>
        ) : (
          <button
            onClick={() => onHide(requirement.id, requirement.title)}
            className="w-full dbc-btn dbc-btn-sm dbc-btn-danger border border-rose-200 hover:bg-rose-100"
          >
            🛑 Hide Listing
          </button>
        )}
        {requirement.status === 'Closed' ? (
          <button
            onClick={() => onReopen(requirement.id, requirement.title)}
            className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary text-emerald-800 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100"
          >
            🔓 Reopen Listing
          </button>
        ) : (
          <button
            onClick={() => onCloseRequirement(requirement.id, requirement.title)}
            className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
          >
            🔒 Close Listing
          </button>
        )}
        <button
          onClick={() => alert(`Opening customer account info profile: ${requirement.customerName}`)}
          className="col-span-2 w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
        >
          👤 View Customer Profile
        </button>
      </div>
    </div>
  );
}
