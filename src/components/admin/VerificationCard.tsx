interface VerificationRequest {
  id: string;
  name: string;
  category: string;
  licenseNumber: string;
  experience: string;
  documentName: string;
  submittedDate?: string;
  status?: string;
}

interface VerificationCardProps {
  requests: VerificationRequest[];
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  onReview: (id: string) => void;
}

export default function VerificationCard({
  requests,
  onApprove,
  onReject,
  onReview,
}: VerificationCardProps) {
  const displayRequests = requests.slice(0, 5);

  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left select-none">
      <div className="border-b border-light-border/40 pb-3">
        <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
          Pending Verifications Backlog
        </h3>
        <p className="text-2xs text-stone-500 font-medium mt-0.5">
          Review business registrations and professional qualifications. Showing latest five.
        </p>
      </div>

      {displayRequests.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
          No pending verification requests.
        </div>
      ) : (
        <div className="space-y-4">
          {displayRequests.map((req) => (
            <div 
              key={req.id} 
              className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-stone-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-xs font-black text-stone-900">{req.name}</h4>
                  <span className="bg-amber-50 border border-amber-100 text-3xs font-black px-2 py-0.5 rounded-full uppercase text-amber-800 tracking-wider">
                    {req.category || 'Provider'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-2xs text-stone-500 font-semibold">
                  <p>📋 License: <span className="text-stone-700">{req.licenseNumber}</span></p>
                  <p>⏱️ Experience: <span className="text-stone-700">{req.experience}</span></p>
                  <p>📄 Document: <span className="text-stone-750 underline cursor-pointer" onClick={() => alert(`Opening document: ${req.documentName}`)}>{req.documentName}</span></p>
                  <p>🗓️ Date: <span className="text-stone-700">{req.submittedDate || '03 Aug 2026'}</span></p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => onReview(req.id)}
                  className="px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-lg text-3xs font-bold uppercase transition cursor-pointer"
                >
                  Review
                </button>
                <button
                  onClick={() => onApprove(req.id, req.name)}
                  className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-800 text-white rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => onReject(req.id, req.name)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-3xs font-bold uppercase transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
