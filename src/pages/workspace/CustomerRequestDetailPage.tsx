import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectRequestApi, toApiError } from '../../services/projectRequest/projectRequestService';
import { quotationClientService, type Quotation, type QuotationStatus } from '../../services/quotation/quotationClientService';
import { chatApi } from '../../services/chat/chatService';
import { ProjectService } from '../../services/contractor/ProjectService';
import type { RequirementResponse } from '../../types/customer/RequirementTypes';
import type { Conversation } from '../../types/chat/chatTypes';
import {
  REQUEST_STATUS,
  REQUEST_STEPS,
  QUOTATION_STATUS,
  formatBudget,
  formatDate,
  formatINR,
  splitDescription,
} from '../../utils/requestStatus';
import { StatusBadge } from '../../components/requests/StatusBadge';

type Detail = RequirementResponse & { reference?: string };

const DECIDABLE: QuotationStatus[] = ['SUBMITTED', 'VIEWED', 'UNDER_REVIEW', 'NEGOTIATION', 'REVISED'];
const CANCELLABLE = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'PROVIDER_REVIEW', 'QUOTATION_RECEIVED', 'CUSTOMER_REVIEW', 'ON_HOLD'];
const PRICE_MODEL: Record<string, string> = { FIXED: 'Fixed price', MILESTONE_BASED: 'Milestone based', HOURLY: 'Hourly', DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', CUSTOM: 'Custom' };

/** Accepting follows the backend state machine: SUBMITTED → VIEWED → UNDER_REVIEW → ACCEPTED (each step validated server-side). */
async function acceptQuotation(q: Quotation) {
  let status = q.status;
  if (status === 'SUBMITTED') status = (await quotationClientService.updateStatus(q.id, 'VIEWED')).status;
  if (status === 'VIEWED') await quotationClientService.updateStatus(q.id, 'UNDER_REVIEW', 'Customer is reviewing');
  return quotationClientService.updateStatus(q.id, 'ACCEPTED', 'Accepted by customer');
}

interface Loaded {
  req: Detail;
  quotes: Quotation[];
  threads: Conversation[];
  projectId: string | null;
}

async function fetchRequest(requestId: number): Promise<Loaded> {
  const [r, q, c, p] = await Promise.all([
    projectRequestApi.get<Detail>(requestId),
    quotationClientService.getQuotations({ requirementId: requestId }).catch(() => [] as Quotation[]),
    chatApi.listConversations().catch(() => [] as Conversation[]),
    ProjectService.listProjects().catch(() => []),
  ]);
  return {
    req: r,
    quotes: q.filter((x) => x.status !== 'WITHDRAWN'),
    threads: c.filter((x) => Number(x.requirementId) === requestId),
    projectId: p.find((x) => x.requirementId === requestId)?.id ?? null,
  };
}

export default function CustomerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const [req, setReq] = useState<Detail | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [open, setOpen] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'accept' | 'reject' | 'cancel'; quote?: Quotation } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const apply = useCallback((d: Loaded) => {
    setReq(d.req);
    setQuotes(d.quotes);
    setThreads(d.threads);
    setProjectId(d.projectId);
    setState('ready');
  }, []);
  const fail = useCallback((err: unknown) => {
    const e = toApiError(err, 'Could not load this request.');
    setState(e.status === 403 || e.status === 404 ? 'forbidden' : 'error');
  }, []);
  const load = useCallback(() => fetchRequest(requestId).then(apply).catch(fail), [requestId, apply, fail]);

  useEffect(() => {
    let alive = true;
    fetchRequest(requestId)
      .then((d) => alive && apply(d))
      .catch((e) => alive && fail(e));
    return () => {
      alive = false;
    };
  }, [requestId, apply, fail]);

  const expand = async (q: Quotation) => {
    setOpen((cur) => (cur === q.id ? null : q.id));
    // Opening a new quotation records that the customer has viewed it (validated transition).
    if (q.status === 'SUBMITTED') {
      try {
        const updated = await quotationClientService.updateStatus(q.id, 'VIEWED');
        setQuotes((list) => list.map((x) => (x.id === q.id ? { ...x, status: updated.status } : x)));
      } catch {
        /* viewing is informational only */
      }
    }
  };

  const decide = async () => {
    if (!confirm || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      if (confirm.kind === 'accept' && confirm.quote) {
        await acceptQuotation(confirm.quote);
        setNotice({ tone: 'ok', text: 'Quotation accepted. Your project has been created.' });
      } else if (confirm.kind === 'reject' && confirm.quote) {
        await quotationClientService.updateStatus(confirm.quote.id, 'REJECTED', 'Declined by customer');
        setNotice({ tone: 'ok', text: 'Quotation declined. The professional has been notified.' });
      } else if (confirm.kind === 'cancel') {
        await projectRequestApi.cancel(requestId, 'Cancelled by customer');
        setNotice({ tone: 'ok', text: 'Request cancelled.' });
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setNotice({ tone: 'err', text: toApiError(err, 'That action could not be completed. Please refresh and try again.').message });
      setConfirm(null);
      await load();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (state === 'loading') return <div className="mx-auto max-w-4xl" role="status"><div className="h-40 animate-pulse rounded-2xl bg-stone-200/70" /><span className="sr-only">Loading request…</span></div>;
  if (state === 'forbidden' || state === 'error' || !req) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center">
        <h1 className="text-lg font-bold text-stone-900">{state === 'forbidden' ? 'Request not found' : 'Something went wrong'}</h1>
        <p className="mt-1 text-sm text-stone-600">{state === 'forbidden' ? 'This request does not exist or belongs to another account.' : 'We could not load this request.'}</p>
        <div className="mt-4 flex justify-center gap-2">
          {state === 'error' && <button type="button" onClick={() => { setState('loading'); void load(); }} className="dbc-btn dbc-btn-secondary min-h-[44px]">Try again</button>}
          <Link to="/workspace/requests" className="dbc-btn dbc-btn-primary min-h-[44px]">All requests</Link>
        </div>
      </div>
    );
  }

  const s = REQUEST_STATUS[req.status] ?? { label: req.status, tone: 'neutral' as const, step: 0 };
  const accepted = quotes.find((q) => q.status === 'ACCEPTED');
  const { text, details } = splitDescription(req.description);
  const invite = threads.find((t) => t.conversationType === 'PROJECT_REQUEST');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link to="/workspace/requests" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-stone-700 hover:text-stone-900">← All requests</Link>

      <header className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-stone-600">{req.reference} · {req.serviceCategory} · Submitted {formatDate(req.createdAt)}</p>
            <h1 className="mt-1 text-xl font-bold text-stone-900 font-display [overflow-wrap:anywhere] sm:text-2xl">{req.title}</h1>
          </div>
          <StatusBadge label={s.label} tone={s.tone} />
        </div>
        {s.step > 0 && (
          <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Request progress">
            {REQUEST_STEPS.map((label, i) => (
              <li key={label} aria-current={i + 1 === s.step ? 'step' : undefined}>
                <span className={`block h-1.5 rounded-full ${i + 1 <= s.step ? 'bg-emerald-700' : 'bg-stone-200'}`} />
                <span className={`mt-1.5 block text-[11px] leading-tight sm:text-xs ${i + 1 === s.step ? 'font-semibold text-stone-900' : 'text-stone-600'}`}>{label}</span>
              </li>
            ))}
          </ol>
        )}
        {projectId && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-emerald-900"><span className="font-semibold">Project created.</span> Documents, milestones and timeline are now in the project workspace.</p>
            <Link to={`/projects/${projectId}`} className="dbc-btn dbc-btn-primary min-h-[44px] shrink-0">Open project</Link>
          </div>
        )}
      </header>

      {notice && <p className={`rounded-xl p-3 text-sm ${notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-800'}`} role={notice.tone === 'ok' ? 'status' : 'alert'}>{notice.text}</p>}

      {/* Conversations with professionals */}
      <section aria-labelledby="rq-msg" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 id="rq-msg" className="text-base font-semibold text-stone-900">Professionals</h2>
        {threads.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600">{invite ? '' : 'Professionals who review your request can message you here before sending a quotation.'}</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {threads.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{t.provider?.businessName || t.provider?.fullName || 'Professional'}</p>
                  <p className="truncate text-sm text-stone-600">{t.conversationType === 'PROJECT_REQUEST' ? 'You sent this request' : 'Contacted you about this request'}{t.lastMessage ? ` · “${t.lastMessage}”` : ''}</p>
                </div>
                <Link to={`/workspace/inbox?conversation=${t.id}`} className="dbc-btn dbc-btn-secondary min-h-[44px] shrink-0">Messages</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quotations */}
      <section aria-labelledby="rq-quotes" className="space-y-3">
        <h2 id="rq-quotes" className="text-base font-semibold text-stone-900">Quotations {quotes.length > 0 && <span className="text-stone-600">({quotes.length})</span>}</h2>
        {quotes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-600">No quotations yet. You'll be notified when a professional sends one.</p>
        )}
        {quotes.map((q) => {
          const qs = QUOTATION_STATUS[q.status] ?? { label: q.status, tone: 'neutral' as const };
          const canDecide = !accepted && DECIDABLE.includes(q.status);
          const isOpen = open === q.id;
          return (
            <article key={q.id} className={`rounded-2xl border bg-white ${q.status === 'ACCEPTED' ? 'border-emerald-700' : 'border-stone-200'}`}>
              <button type="button" onClick={() => void expand(q)} aria-expanded={isOpen} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left sm:p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{q.provider?.businessName || q.provider?.fullName || 'Professional'}</p>
                  <p className="text-sm text-stone-600">{q.proposal?.title || 'Quotation'} · {q.estimatedDurationDays} day{q.estimatedDurationDays === 1 ? '' : 's'}{q.warrantyMonths ? ` · ${q.warrantyMonths}-month warranty` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-stone-900">{formatINR(q.totalAmount)}</span>
                  <StatusBadge label={qs.label} tone={qs.tone} />
                </div>
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-stone-100 p-4 text-sm sm:p-5">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div><dt className="text-stone-600">Pricing</dt><dd className="font-medium text-stone-900">{PRICE_MODEL[q.priceModel] ?? q.priceModel}</dd></div>
                    <div><dt className="text-stone-600">Estimated duration</dt><dd className="font-medium text-stone-900">{q.estimatedDurationDays} days</dd></div>
                  </dl>
                  {q.proposal && (
                    <dl className="space-y-3">
                      {([['Summary', q.proposal.summary], ['Scope of work', q.proposal.scope], ['Deliverables', q.proposal.deliverables], ['Assumptions', q.proposal.assumptions], ['Exclusions', q.proposal.exclusions], ['Notes', q.proposal.notes]] as Array<[string, string | undefined]>)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}><dt className="font-semibold text-stone-900">{k}</dt><dd className="mt-0.5 whitespace-pre-line text-stone-700">{v}</dd></div>
                        ))}
                    </dl>
                  )}
                  {q.milestones && q.milestones.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-sm">
                        <caption className="mb-2 text-left font-semibold text-stone-900">Cost breakdown</caption>
                        <thead><tr className="border-b border-stone-200 text-stone-600"><th className="py-2 pr-3 font-medium">Milestone</th><th className="py-2 pr-3 font-medium">Duration</th><th className="py-2 text-right font-medium">Cost</th></tr></thead>
                        <tbody>
                          {q.milestones.map((m, i) => (
                            <tr key={m.id ?? i} className="border-b border-stone-100">
                              <td className="py-2 pr-3"><span className="font-medium text-stone-900">{m.name}</span>{m.description && <span className="block text-xs text-stone-600">{m.description}</span>}</td>
                              <td className="py-2 pr-3 text-stone-700">{m.durationDays ? `${m.durationDays} days` : '—'}</td>
                              <td className="py-2 text-right font-medium text-stone-900">{formatINR(m.cost)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr><td className="pt-2 font-semibold" colSpan={2}>Total</td><td className="pt-2 text-right font-bold">{formatINR(q.totalAmount)}</td></tr></tfoot>
                      </table>
                    </div>
                  )}
                  <p className="text-xs text-stone-600">Amounts are as quoted by the professional. Payment terms are agreed in the project; nothing is charged when you accept.</p>
                  {canDecide && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setConfirm({ kind: 'accept', quote: q })} className="dbc-btn dbc-btn-primary min-h-[44px]">Accept quotation</button>
                      <button type="button" onClick={() => setConfirm({ kind: 'reject', quote: q })} className="dbc-btn dbc-btn-secondary min-h-[44px]">Decline</button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Request details */}
      <section aria-labelledby="rq-details" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 id="rq-details" className="text-base font-semibold text-stone-900">Your request</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{text}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-stone-600">Site</dt><dd className="font-medium text-stone-900 [overflow-wrap:anywhere]">{req.location}</dd></div>
          <div><dt className="text-stone-600">Budget</dt><dd className="font-medium text-stone-900">{details.find(([k]) => k === 'Budget')?.[1] ?? formatBudget(req.budgetMin, req.budgetMax)}</dd></div>
          {details.filter(([k]) => k !== 'Budget').map(([k, v]) => (
            <div key={k}><dt className="text-stone-600">{k}</dt><dd className="font-medium text-stone-900">{v}</dd></div>
          ))}
        </dl>
        {req.attachments && req.attachments.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {req.attachments.map((a) => (
              <li key={a.id}><a href={a.fileUrl} target="_blank" rel="noreferrer"><img src={a.fileUrl} alt={a.fileName} loading="lazy" className="aspect-square w-full rounded-xl bg-stone-100 object-cover" /></a></li>
            ))}
          </ul>
        )}
        {CANCELLABLE.includes(req.status) && (
          <button type="button" onClick={() => setConfirm({ kind: 'cancel' })} className="mt-5 min-h-[44px] text-sm font-semibold text-rose-700 hover:underline">Cancel request</button>
        )}
      </section>

      {confirm && (
        <div className="dbc-modal-overlay" role="presentation">
          <div className="dbc-modal dbc-modal-sm" role="dialog" aria-modal="true" aria-labelledby="rq-confirm-title">
            <div className="dbc-modal-header">
              <h2 id="rq-confirm-title" className="dbc-modal-title">
                {confirm.kind === 'accept' ? 'Accept this quotation?' : confirm.kind === 'reject' ? 'Decline this quotation?' : 'Cancel this request?'}
              </h2>
              <button type="button" className="dbc-modal-close" onClick={() => setConfirm(null)} aria-label="Close">×</button>
            </div>
            <div className="space-y-2 p-5 text-sm text-stone-700">
              {confirm.kind === 'accept' && confirm.quote && (
                <>
                  <p>You're accepting <strong>{confirm.quote.provider?.businessName || confirm.quote.provider?.fullName}</strong>'s quotation of <strong>{formatINR(confirm.quote.totalAmount)}</strong>.</p>
                  <p>A project will be created with this professional, and other open quotations for this request will be declined. No payment is taken now.</p>
                </>
              )}
              {confirm.kind === 'reject' && <p>The professional will be told you've declined. You can still accept other quotations.</p>}
              {confirm.kind === 'cancel' && <p>Professionals will no longer be able to send quotations for this request.</p>}
            </div>
            <div className="dbc-modal-footer">
              <button type="button" onClick={() => setConfirm(null)} className="dbc-btn dbc-btn-secondary min-h-[44px]">Go back</button>
              <button type="button" onClick={() => void decide()} disabled={busy} className={`dbc-btn min-h-[44px] ${confirm.kind === 'accept' ? 'dbc-btn-primary' : 'dbc-btn-danger'}`}>
                {busy ? 'Please wait…' : confirm.kind === 'accept' ? 'Accept & create project' : confirm.kind === 'reject' ? 'Decline quotation' : 'Cancel request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
