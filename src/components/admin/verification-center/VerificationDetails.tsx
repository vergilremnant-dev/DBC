import { useState, useEffect, startTransition } from 'react';
import StatusBadge from './StatusBadge';
import type { VerificationRequest } from '../../../pages/admin/AdminDashboard';

interface VerificationDetailsProps {
  request: VerificationRequest | null;
  onClose: () => void;
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  onRequestInfo: (id: string, name: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
}

export default function VerificationDetails({
  request,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
  onSaveNotes,
}: VerificationDetailsProps) {
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Sync internalNotes state when selected request changes
  useEffect(() => {
    startTransition(() => {
      setInternalNotes(request ? request.notes || '' : '');
    });
  }, [request]);

  if (!request) {
    return (
      <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-2.5 shadow-apple-sm text-stone-450 h-full flex flex-col justify-center select-none">
        <span className="text-3xl">👤</span>
        <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Select an Applicant</h4>
        <p className="text-[10px] text-stone-500 font-medium">Click on a verification row or card to inspect documents and take action.</p>
      </div>
    );
  }

  const handleSaveNotesClick = () => {
    onSaveNotes(request.id, internalNotes);
    alert('Internal audit review notes saved successfully.');
  };

  return (
    <aside className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left relative select-none max-h-[720px] overflow-y-auto">
      {/* Header detail */}
      <div className="flex justify-between items-start border-b border-light-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-400 font-bold">{request.id}</span>
            <StatusBadge status={request.status} />
          </div>
          <h3 className="text-xs font-black text-stone-900 mt-1 leading-snug">{request.name}</h3>
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
        {/* Applicant details */}
        <div>
          <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider mb-2">
            Applicant Identity
          </span>
          <div className="space-y-2">
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Full Name:</span> <strong className="text-stone-900">{request.name}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Account Role:</span> 
              <span className="bg-stone-100 text-stone-750 text-[8.5px] px-2 py-0.5 rounded font-black uppercase">
                {request.role}
              </span>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Email coordinates:</span> <strong className="text-stone-900">{request.email}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Phone contact:</span> <strong className="text-stone-900">{request.phone}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Trade Category:</span> <strong className="text-stone-900">{request.category}</strong>
            </p>
            <p className="flex justify-between border-b border-light-border/40 pb-1.5">
              <span>Experience:</span> <strong className="text-stone-900">{request.experience}</strong>
            </p>
            <p className="flex justify-between">
              <span>Primary Location:</span> <strong className="text-stone-900">{request.location || 'Hyderabad'}</strong>
            </p>
          </div>
        </div>

        {/* Business details */}
        {request.businessName && (
          <div>
            <span className="block text-[8px] font-black uppercase text-stone-455 tracking-wider mb-2">
              Business Registration
            </span>
            <div className="space-y-2">
              <p className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Company Name:</span> <strong className="text-stone-900">{request.businessName}</strong>
              </p>
              <p className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>License Code:</span> <strong className="text-stone-900">{request.licenseNumber || 'VST-2026-90'}</strong>
              </p>
              <p className="flex justify-between">
                <span>Corporate Registration No:</span> <strong className="text-stone-900">{request.registrationNumber || 'U74999TG2026PTC'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Internal Audit Review Notes */}
        <div className="space-y-2">
          <label className="block text-[8px] font-black uppercase text-stone-455 tracking-wider">
            Internal Moderator Review Notes
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Add compliance notes, document validation checklists, structural checks records..."
            className="dbc-input text-[10px] min-h-[80px]"
          />
          <button
            onClick={handleSaveNotesClick}
            className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-50 border border-stone-200 hover:bg-stone-100"
          >
            Save Internal Review Notes
          </button>
        </div>
      </div>

      {/* Moderation Controls Actions */}
      <div className="pt-4 border-t border-light-border space-y-2">
        <span className="block text-[8.5px] font-black uppercase text-stone-850 tracking-wider">
          Compliance Command Actions
        </span>

        <div className="flex flex-col gap-2">
          {request.status === 'Pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(request.id, request.name)}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Approve Verify
              </button>
              <button
                onClick={() => onReject(request.id, request.name)}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-danger"
              >
                Reject Verify
              </button>
            </div>
          )}

          {request.status !== 'Approved' && (
            <button
              onClick={() => onRequestInfo(request.id, request.name)}
              className="w-full dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Request Additional Documents
            </button>
          )}

          <button
            onClick={() => alert(`Opening public applicant profile catalog preview for: ${request.name}`)}
            className="w-full dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            View Public Profile &rarr;
          </button>
        </div>
      </div>
    </aside>
  );
}
export type { VerificationDetailsProps };
