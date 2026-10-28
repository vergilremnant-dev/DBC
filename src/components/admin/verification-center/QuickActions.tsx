import type { VerificationRequest } from '../../../pages/admin/AdminDashboard';

interface QuickActionsProps {
  request: VerificationRequest | null;
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  onRequestInfo: (id: string, name: string) => void;
  onSelectRequest: (req: VerificationRequest) => void;
}

export default function QuickActions({
  request,
  onApprove,
  onReject,
  onRequestInfo,
  onSelectRequest,
}: QuickActionsProps) {
  if (!request) {
    return (
      <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-center text-2xs text-stone-400 font-medium select-none">
        No verification request selected for quick shortcuts.
      </div>
    );
  }

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none animate-gentle-fade">
      <div>
        <h4 className="text-2xs font-black uppercase text-stone-900 tracking-wider">
          Verification Shortcuts
        </h4>
        <span className="block text-3xs text-stone-400 font-bold uppercase mt-0.5">
          Applicant: {request.name} &bull; Status: {request.status}
        </span>
      </div>

      <div className="grid gap-2 grid-cols-2 text-3xs font-black uppercase tracking-wider text-center">
        <button
          onClick={() => onSelectRequest(request)}
          className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-850 font-extrabold transition focus:outline-none"
        >
          🔍 Inspect Request
        </button>
        <button
          onClick={() => alert(`Opening profile details for applicant: ${request.name}`)}
          className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-850 font-extrabold transition focus:outline-none"
        >
          👤 View Profile
        </button>

        {request.status === 'Pending' ? (
          <>
            <button
              onClick={() => onApprove(request.id, request.name)}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 font-extrabold transition focus:outline-none"
            >
              ✅ Approve Verify
            </button>
            <button
              onClick={() => onReject(request.id, request.name)}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold transition focus:outline-none"
            >
              🚫 Reject Request
            </button>
          </>
        ) : (
          <span className="col-span-2 text-3xs text-center font-bold text-stone-400 py-2 border border-dashed border-stone-200 rounded-xl">
            Decision Finalized: status is {request.status}
          </span>
        )}

        {request.status !== 'Approved' && (
          <button
            onClick={() => onRequestInfo(request.id, request.name)}
            className="col-span-2 p-2.5 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-850 font-extrabold transition focus:outline-none"
          >
            📋 Request Documents Upload
          </button>
        )}
      </div>
    </div>
  );
}
