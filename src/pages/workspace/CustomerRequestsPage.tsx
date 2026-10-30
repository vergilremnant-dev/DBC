import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RequirementService } from '../../services/customer/RequirementService';
import { quotationClientService } from '../../services/quotation/quotationClientService';
import type { RequirementResponse } from '../../types/customer/RequirementTypes';
import { REQUEST_STATUS, formatDate, requestReference } from '../../utils/requestStatus';
import { StatusBadge } from '../../components/requests/StatusBadge';

/** /workspace/requests — the customer's project requests with status and quotation counts. */
export default function CustomerRequestsPage() {
  const [items, setItems] = useState<RequirementResponse[]>([]);
  const [quoteCounts, setQuoteCounts] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([RequirementService.getMyRequirements(), quotationClientService.getQuotations().catch(() => [])])
      .then(([reqs, quotes]) => {
        if (!alive) return;
        const counts: Record<number, number> = {};
        for (const q of quotes) if (q.status !== 'WITHDRAWN') counts[q.requirementId] = (counts[q.requirementId] ?? 0) + 1;
        setItems([...reqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setQuoteCounts(counts);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [attempt]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-display">Project requests</h1>
          <p className="mt-1 text-sm text-stone-600">Track your requests, messages and quotations from professionals.</p>
        </div>
        <Link to="/services" className="dbc-btn dbc-btn-primary min-h-[44px]">New request</Link>
      </header>

      {status === 'loading' && (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200/70" />)}
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center" role="alert">
          <p className="text-sm text-stone-700">We couldn't load your requests.</p>
          <button type="button" onClick={() => { setStatus('loading'); setAttempt((n) => n + 1); }} className="dbc-btn dbc-btn-secondary mt-3 min-h-[44px]">Try again</button>
        </div>
      )}
      {status === 'ready' && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-base font-semibold text-stone-900">No project requests yet</p>
          <p className="mt-1 text-sm text-stone-600">Choose a service, pick a professional (or ask all of them), and describe your project to receive quotations.</p>
          <Link to="/services" className="dbc-btn dbc-btn-primary mt-4 min-h-[44px]">Browse services</Link>
        </div>
      )}
      {status === 'ready' && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((r) => {
            const s = REQUEST_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
            const n = quoteCounts[r.id] ?? 0;
            return (
              <li key={r.id}>
                <Link to={`/workspace/requests/${r.id}`} className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-700/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-stone-600">{requestReference(r.id)} · {r.serviceCategory} · {formatDate(r.createdAt)}</p>
                      <h2 className="mt-0.5 text-base font-semibold text-stone-900 [overflow-wrap:anywhere]">{r.title}</h2>
                    </div>
                    <StatusBadge {...s} />
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{n ? `${n} quotation${n === 1 ? '' : 's'} received` : 'No quotations yet'}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-stone-600">
        Looking for an earlier booking? <Link to="/workspace/bookings" className="font-semibold text-emerald-800 hover:underline">View earlier bookings</Link>
      </p>
    </div>
  );
}
