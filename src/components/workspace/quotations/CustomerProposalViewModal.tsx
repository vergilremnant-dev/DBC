import { useState } from 'react';
import type { Quotation, QuotationStatus } from '../../../services/quotation/quotationClientService';
import { quotationClientService } from '../../../services/quotation/quotationClientService';

interface CustomerProposalViewModalProps {
  quotation: Quotation;
  onClose: () => void;
  onUpdated?: (updated: Quotation) => void;
}

export default function CustomerProposalViewModal({
  quotation,
  onClose,
  onUpdated,
}: CustomerProposalViewModalProps) {
  const [currentQuotation, setCurrentQuotation] = useState<Quotation>(quotation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'ACCEPT' | 'DECLINE' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  const handleStatusTransition = async (targetStatus: QuotationStatus, reason?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await quotationClientService.updateStatus(currentQuotation.id, targetStatus, reason);
      setCurrentQuotation(updated);
      setConfirmAction(null);
      if (onUpdated) onUpdated(updated);

      if (targetStatus === 'ACCEPTED') {
        showNotice('✓ Proposal accepted successfully! Project creation boundary completed.');
      } else if (targetStatus === 'REJECTED') {
        showNotice('Proposal declined.');
      }
    } catch (err: any) {
      console.error('Failed to update proposal status', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update proposal status.';
      showNotice(`⚠️ ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">Draft</span>;
      case 'SUBMITTED':
      case 'VIEWED':
      case 'UNDER_REVIEW':
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Awaiting Your Review</span>;
      case 'ACCEPTED':
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">✓ Accepted</span>;
      case 'REJECTED':
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">Declined</span>;
      case 'WITHDRAWN':
      case 'EXPIRED':
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">{status}</span>;
      default:
        return <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  const isPendingReview = ['SUBMITTED', 'VIEWED', 'UNDER_REVIEW', 'NEGOTIATION', 'REVISED'].includes(currentQuotation.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      
      {/* Notice Banner */}
      {noticeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-stone-700 animate-gentle-fade flex items-center gap-2">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="text-stone-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Confirmation Dialog Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-stone-900">
              {confirmAction === 'ACCEPT' ? 'Accept Commercial Proposal?' : 'Decline Commercial Proposal?'}
            </h3>

            {confirmAction === 'ACCEPT' ? (
              <p className="text-stone-600 leading-relaxed">
                Accepting this proposal confirms your agreement to the proposed project scope, total cost of <strong>₹{currentQuotation.totalAmount.toLocaleString()}</strong>, and execution timeline. This action moves your project request to the formal project stage.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-stone-600 leading-relaxed">
                  Are you sure you want to decline this proposal? The professional will be notified.
                </p>
                <input
                  type="text"
                  placeholder="Optional reason for declining..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full dbc-input text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
                className="dbc-btn dbc-btn-sm dbc-btn-outline"
              >
                Cancel
              </button>

              {confirmAction === 'ACCEPT' ? (
                <button
                  onClick={() => handleStatusTransition('ACCEPTED')}
                  disabled={isSubmitting}
                  className="dbc-btn dbc-btn-sm dbc-btn-primary"
                >
                  {isSubmitting ? 'Accepting...' : 'Confirm Acceptance'}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusTransition('REJECTED', declineReason)}
                  disabled={isSubmitting}
                  className="dbc-btn dbc-btn-sm dbc-btn-danger"
                >
                  {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal Container */}
      <div className="bg-white border border-stone-300 max-w-3xl w-full rounded-3xl shadow-2xl overflow-hidden my-8 animate-gentle-fade text-left">
        
        {/* Modal Header */}
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Project Proposal</span>
              {getStatusBadge(currentQuotation.status)}
            </div>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              {currentQuotation.proposal?.title || currentQuotation.requirement?.title || `Proposal #${currentQuotation.id}`}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Professional: <strong className="text-stone-800">{currentQuotation.provider?.businessName || 'Verified Professional'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 text-sm font-bold rounded-lg hover:bg-stone-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 text-xs text-stone-700 max-h-[70vh] overflow-y-auto">
          
          {/* Executive Summary */}
          {currentQuotation.proposal?.summary && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">Executive Summary</span>
              <p className="text-stone-800 font-medium leading-relaxed">{currentQuotation.proposal.summary}</p>
            </div>
          )}

          {/* Scope of Work */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Project Scope & Specifications</h4>
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 leading-relaxed font-normal whitespace-pre-line">
              {currentQuotation.proposal?.scope || 'Standard professional execution scope provided upon review.'}
            </div>
          </div>

          {/* Deliverables */}
          {currentQuotation.proposal?.deliverables && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Project Deliverables</h4>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 leading-relaxed whitespace-pre-line">
                {currentQuotation.proposal.deliverables}
              </div>
            </div>
          )}

          {/* Assumptions & Exclusions */}
          {(currentQuotation.proposal?.assumptions || currentQuotation.proposal?.exclusions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuotation.proposal?.assumptions && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-stone-400">Assumptions</span>
                  <p className="text-stone-700 leading-relaxed">{currentQuotation.proposal.assumptions}</p>
                </div>
              )}
              {currentQuotation.proposal?.exclusions && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-stone-400">Exclusions</span>
                  <p className="text-stone-700 leading-relaxed">{currentQuotation.proposal.exclusions}</p>
                </div>
              )}
            </div>
          )}

          {/* Commercial & Pricing Breakdown */}
          <div className="border-t border-stone-200 pt-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Commercial Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-emerald-800 block">Proposed Total Amount</span>
                <span className="text-xl font-extrabold text-stone-900 block mt-1">₹{currentQuotation.totalAmount.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-700 font-medium block mt-0.5">Pricing Model: {currentQuotation.priceModel}</span>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-stone-400 block">Estimated Execution Timeline</span>
                <span className="text-lg font-bold text-stone-900 block mt-1">{currentQuotation.estimatedDurationDays} Days</span>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-stone-400 block">Warranty Period</span>
                <span className="text-lg font-bold text-stone-900 block mt-1">
                  {currentQuotation.warrantyMonths ? `${currentQuotation.warrantyMonths} Months` : 'Standard'}
                </span>
              </div>
            </div>

            {/* Milestones if present */}
            {currentQuotation.milestones && currentQuotation.milestones.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-[9px] font-black uppercase text-stone-400">Proposed Execution Milestones</span>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {currentQuotation.milestones.map((m, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-stone-800 block">{m.name}</strong>
                        {m.description && <span className="text-stone-400 text-[10px]">{m.description}</span>}
                      </div>
                      <span className="font-bold text-stone-900">₹{m.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terms & Notes */}
          {currentQuotation.proposal?.notes && (
            <div className="border-t border-stone-200 pt-4 space-y-1">
              <span className="text-[9px] font-black uppercase text-stone-400">Additional Terms & Notes</span>
              <p className="text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">{currentQuotation.proposal.notes}</p>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto dbc-btn dbc-btn-sm dbc-btn-outline"
          >
            Close Proposal
          </button>

          {isPendingReview ? (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setConfirmAction('DECLINE')}
                className="w-full sm:w-auto dbc-btn dbc-btn-sm dbc-btn-danger"
              >
                Decline Proposal
              </button>
              <button
                onClick={() => setConfirmAction('ACCEPT')}
                className="w-full sm:w-auto dbc-btn dbc-btn-sm dbc-btn-primary"
              >
                Accept Proposal
              </button>
            </div>
          ) : currentQuotation.status === 'ACCEPTED' ? (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ Proposal Accepted & Linked to Project
            </span>
          ) : (
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              Status: {currentQuotation.status}
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
