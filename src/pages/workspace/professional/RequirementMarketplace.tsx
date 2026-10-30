import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectRequestApi, type ProviderRequestView } from '../../../services/projectRequest/projectRequestService';
import { REQUEST_STATUS, QUOTATION_STATUS, formatBudget, formatDate, splitDescription } from '../../../utils/requestStatus';
import { StatusBadge } from '../../../components/requests/StatusBadge';

type Scope = 'invited' | 'open';

/**
 * Professional request inbox (real data):
 *  - "Sent to you": requests a customer sent to you, or that you've contacted/quoted.
 *  - "Open requests": requests for your service that any professional can quote.
 */
export default function RequirementMarketplace() {
  const [scope, setScope] = useState<Scope>('invited');
  const [data, setData] = useState<Record<Scope, ProviderRequestView[] | null>>({ invited: null, open: null });
  const [error, setError] = useState<Record<Scope, string>>({ invited: '', open: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (['invited', 'open'] as Scope[]).forEach((s) =>
      projectRequestApi
        .inbox(s)
        .then((rows) => alive && setData((d) => ({ ...d, [s]: rows })))
        .catch((e) => alive && setError((x) => ({ ...x, [s]: e.message || 'Could not load requests.' }))),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  const list = data[scope];
  const tabs: Array<{ key: Scope; label: string }> = [
    { key: 'invited', label: 'Sent to you' },
    { key: 'open', label: 'Open requests' },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-stone-900 font-display">Project requests</h1>
        <p className="mt-1 text-sm text-stone-600">Review customer requirements, message customers, and send quotations.</p>
      </header>

      <div role="tablist" aria-label="Request lists" className="inline-flex rounded-2xl bg-stone-200/70 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={scope === t.key}
            onClick={() => setScope(t.key)}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${scope === t.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-700'}`}
          >
            {t.label}
            {data[t.key] && <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 text-xs text-stone-700">{data[t.key]!.length}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tabs.find((t) => t.key === scope)!.label}>
        {error[scope] ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center" role="alert">
            <p className="text-sm text-stone-700">{error[scope]}</p>
            <button type="button" onClick={() => { setError({ invited: '', open: '' }); setData({ invited: null, open: null }); setAttempt((n) => n + 1); }} className="dbc-btn dbc-btn-secondary mt-3 min-h-[44px]">Try again</button>
          </div>
        ) : !list ? (
          <div className="space-y-3" aria-hidden="true">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200/70" />)}</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="font-semibold text-stone-900">{scope === 'invited' ? 'No requests sent to you yet' : 'No open requests for your service right now'}</p>
            <p className="mt-1 text-sm text-stone-600">
              {scope === 'invited' ? 'Customers who choose you from your profile will appear here.' : 'New open requests matching your service will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => {
              const s = REQUEST_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
              const mine = r.myQuotation ? QUOTATION_STATUS[r.myQuotation.status] : null;
              return (
                <li key={r.id}>
                  <Link to={`/workspace/requirement/${r.id}`} className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-700/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-stone-600">{r.reference} · {r.serviceCategory} · {formatDate(r.createdAt)}</p>
                        <h2 className="mt-0.5 text-base font-semibold text-stone-900 [overflow-wrap:anywhere]">{r.title}</h2>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.invited && <StatusBadge label="Sent to you" tone="info" />}
                        {mine ? <StatusBadge label={`Your quote: ${mine.label}`} tone={mine.tone} /> : <StatusBadge {...s} />}
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-stone-700">{splitDescription(r.description).text}</p>
                    <p className="mt-2 text-xs text-stone-600">{r.customer.displayName} · {r.city || 'City not set'} · Budget {formatBudget(r.budgetMin, r.budgetMax)}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
