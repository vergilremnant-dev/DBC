import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quotationClientService, type Quotation } from '../../../services/quotation/quotationClientService';
import { QUOTATION_STATUS, formatDate, formatINR, requestReference } from '../../../utils/requestStatus';
import { StatusBadge } from '../../../components/requests/StatusBadge';

/** /workspace/quotations — the professional's own quotations (real data). */
export default function QuotationManagementPage() {
  const [items, setItems] = useState<Quotation[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    quotationClientService
      .getQuotations()
      .then((q) => alive && setItems(q))
      .catch(() => alive && setError('Could not load your quotations.'));
    return () => {
      alive = false;
    };
  }, [attempt]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-display">Quotations</h1>
          <p className="mt-1 text-sm text-stone-600">Quotations you've drafted or sent. Prepare new ones from a project request.</p>
        </div>
        <Link to="/workspace/leads" className="dbc-btn dbc-btn-primary min-h-[44px]">View requests</Link>
      </header>
      {error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center" role="alert">
          <p className="text-sm text-stone-700">{error}</p>
          <button type="button" onClick={() => { setError(''); setItems(null); setAttempt((n) => n + 1); }} className="dbc-btn dbc-btn-secondary mt-3 min-h-[44px]">Try again</button>
        </div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-200/70" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="font-semibold text-stone-900">No quotations yet</p>
          <p className="mt-1 text-sm text-stone-600">Open a project request and choose “Prepare quotation”.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((q) => {
            const s = QUOTATION_STATUS[q.status] ?? { label: q.status, tone: 'neutral' as const };
            return (
              <li key={q.id}>
                <Link to={`/workspace/requirement/${q.requirementId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 hover:border-emerald-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-xs text-stone-600">{requestReference(q.requirementId)} · {formatDate(q.createdAt)}</p>
                    <p className="mt-0.5 font-semibold text-stone-900 [overflow-wrap:anywhere]">{q.proposal?.title || 'Quotation'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900">{formatINR(q.totalAmount)}</span>
                    <StatusBadge {...s} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
