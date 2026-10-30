import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectRequestApi, toApiError, type ProviderRequestView } from '../../../services/projectRequest/projectRequestService';
import { quotationClientService, type Quotation, type PricingModel } from '../../../services/quotation/quotationClientService';
import { REQUEST_STATUS, QUOTATION_STATUS, formatBudget, formatDate, formatINR, splitDescription } from '../../../utils/requestStatus';
import { StatusBadge } from '../../../components/requests/StatusBadge';
import { axiosClient } from '../../../services/auth/axiosClient';

const QUOTABLE = ['PUBLISHED', 'PROVIDER_REVIEW', 'QUOTATION_RECEIVED', 'CUSTOMER_REVIEW'];
const WITHDRAWABLE = ['SUBMITTED', 'VIEWED', 'UNDER_REVIEW', 'NEGOTIATION', 'REVISED'];

type Milestone = { name: string; cost: string; durationDays: string };
interface QuoteForm {
  title: string;
  summary: string;
  scope: string;
  deliverables: string;
  assumptions: string;
  exclusions: string;
  priceModel: Extract<PricingModel, 'FIXED' | 'MILESTONE_BASED'>;
  totalAmount: string;
  durationDays: string;
  warrantyMonths: string;
  milestones: Milestone[];
}

const inputCls = (err?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-xs outline-none placeholder:text-stone-500 focus:ring-2 sm:text-sm ${
    err ? 'border-rose-500 focus:ring-rose-500/20' : 'border-stone-300 focus:border-emerald-700 focus:ring-emerald-700/20'
  }`;

function F({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-stone-900">{label} {optional && <span className="font-normal text-stone-600">(optional)</span>}</label>
      {children}
      {error && <p className="text-xs font-medium text-rose-700" role="alert">{error}</p>}
    </div>
  );
}

const num = (v: string) => (v.trim() === '' ? NaN : Number(v));

/** /workspace/requirement/:id — professional view of a project request, messaging and quotation. */
export default function RequirementWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();
  const [req, setReq] = useState<ProviderRequestView | null>(null);
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
  const [form, setForm] = useState<QuoteForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const apply = useCallback(
    ([r, qs]: [ProviderRequestView, Quotation[]]) => {
      setReq(r);
      setQuote(qs.find((q) => !['WITHDRAWN', 'ARCHIVED'].includes(q.status)) ?? null);
      setState('ready');
      // An invited request moves to "under review" when the professional opens it (validated server-side).
      if (r.invited && r.status === 'PUBLISHED') {
        projectRequestApi.action(requestId, 'acknowledge').then(() => setReq((x) => (x ? { ...x, status: 'PROVIDER_REVIEW' } : x))).catch(() => {});
      }
    },
    [requestId],
  );
  const fail = useCallback((err: unknown) => {
    const e = toApiError(err, 'Could not load this request.');
    setState(e.status === 403 || e.status === 404 ? 'forbidden' : 'error');
  }, []);
  const fetchAll = useCallback(
    () =>
      Promise.all([
        projectRequestApi.get<ProviderRequestView>(requestId),
        quotationClientService.getQuotations({ requirementId: requestId }).catch(() => [] as Quotation[]),
      ]),
    [requestId],
  );
  const load = useCallback(() => fetchAll().then(apply).catch(fail), [fetchAll, apply, fail]);

  useEffect(() => {
    let alive = true;
    fetchAll()
      .then((d) => alive && apply(d))
      .catch((e) => alive && fail(e));
    return () => {
      alive = false;
    };
  }, [fetchAll, apply, fail]);

  const run = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ tone: 'err', text: toApiError(err, 'That action could not be completed.').message });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const contact = () =>
    run(async () => {
      const res = await projectRequestApi.action(requestId, 'contact');
      if (res.conversationId) navigate(`/workspace/inbox?conversation=${res.conversationId}`);
    });

  const startQuote = () =>
    setForm({
      title: req?.title ?? '',
      summary: '',
      scope: '',
      deliverables: '',
      assumptions: '',
      exclusions: '',
      priceModel: 'FIXED',
      totalAmount: '',
      durationDays: '',
      warrantyMonths: '',
      milestones: [{ name: '', cost: '', durationDays: '' }],
    });

  const milestoneSum = form?.milestones.reduce((s, m) => s + (Number.isFinite(num(m.cost)) ? num(m.cost) : 0), 0) ?? 0;

  const validate = (f: QuoteForm) => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = 'Add a quotation title.';
    if (f.summary.trim().length < 10) e.summary = 'Add a short summary.';
    if (f.scope.trim().length < 10) e.scope = 'Describe the scope of work.';
    if (f.deliverables.trim().length < 3) e.deliverables = 'List what the customer will receive.';
    const days = num(f.durationDays);
    if (!Number.isInteger(days) || days < 1) e.durationDays = 'Enter the estimated duration in whole days.';
    if (f.warrantyMonths && (!Number.isInteger(num(f.warrantyMonths)) || num(f.warrantyMonths) < 0)) e.warrantyMonths = 'Warranty must be whole months.';
    if (f.priceModel === 'FIXED') {
      if (!(num(f.totalAmount) > 0)) e.totalAmount = 'Enter the total amount.';
    } else {
      f.milestones.forEach((m, i) => {
        if (!m.name.trim()) e[`m${i}name`] = 'Name this milestone.';
        if (!(num(m.cost) > 0)) e[`m${i}cost`] = 'Enter a cost.';
      });
      if (!f.milestones.length) e.milestones = 'Add at least one milestone.';
    }
    return e;
  };

  const sendQuote = (submit: boolean) =>
    run(async () => {
      if (!form) return;
      const e = validate(form);
      setErrors(e);
      if (Object.keys(e).length) return;
      const milestone = form.priceModel === 'MILESTONE_BASED';
      const created = await quotationClientService.createQuotation({
        requirementId: requestId,
        priceModel: form.priceModel,
        // For milestone pricing the total is the milestone sum; the server re-validates it.
        totalAmount: milestone ? milestoneSum : num(form.totalAmount),
        estimatedDurationDays: num(form.durationDays),
        warrantyMonths: form.warrantyMonths ? num(form.warrantyMonths) : undefined,
        proposal: {
          title: form.title.trim(),
          summary: form.summary.trim(),
          scope: form.scope.trim(),
          deliverables: form.deliverables.trim(),
          assumptions: form.assumptions.trim() || undefined,
          exclusions: form.exclusions.trim() || undefined,
        },
        milestones: milestone
          ? form.milestones.map((m) => ({ name: m.name.trim(), cost: num(m.cost), durationDays: Number.isInteger(num(m.durationDays)) ? num(m.durationDays) : undefined }))
          : undefined,
      });
      if (submit) await quotationClientService.updateStatus(created.id, 'SUBMITTED', 'Submitted to customer');
      setForm(null);
      setNotice({ tone: 'ok', text: submit ? 'Quotation sent. The customer has been notified.' : 'Draft saved. Send it when you are ready.' });
      await load();
    });

  const submitDraft = () =>
    run(async () => {
      if (!quote) return;
      await quotationClientService.updateStatus(quote.id, 'SUBMITTED', 'Submitted to customer');
      setNotice({ tone: 'ok', text: 'Quotation sent. The customer has been notified.' });
      await load();
    });

  const withdraw = () =>
    run(async () => {
      if (!quote) return;
      await quotationClientService.updateStatus(quote.id, 'WITHDRAWN', 'Withdrawn by professional');
      setNotice({ tone: 'ok', text: 'Quotation withdrawn.' });
      await load();
    });

  const deleteDraft = () =>
    run(async () => {
      if (!quote) return;
      await axiosClient.delete(`/api/quotations/${quote.id}`);
      setNotice({ tone: 'ok', text: 'Draft deleted.' });
      await load();
    });

  if (state === 'loading') return <div className="mx-auto max-w-4xl" role="status"><div className="h-40 animate-pulse rounded-2xl bg-stone-200/70" /><span className="sr-only">Loading request…</span></div>;
  if (state !== 'ready' || !req) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center">
        <h1 className="text-lg font-bold text-stone-900">{state === 'forbidden' ? 'Request not available' : 'Something went wrong'}</h1>
        <p className="mt-1 text-sm text-stone-600">{state === 'forbidden' ? 'This request was sent to another professional, is closed, or is for a different service.' : 'We could not load this request.'}</p>
        <Link to="/workspace/leads" className="dbc-btn dbc-btn-primary mt-4 min-h-[44px]">Back to requests</Link>
      </div>
    );
  }

  const s = REQUEST_STATUS[req.status] ?? { label: req.status, tone: 'neutral' as const };
  const { text, details } = splitDescription(req.description);
  const quotable = QUOTABLE.includes(req.status);
  const qs = quote ? QUOTATION_STATUS[quote.status] ?? { label: quote.status, tone: 'neutral' as const } : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link to="/workspace/leads" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-stone-700 hover:text-stone-900">← All requests</Link>

      <header className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-stone-600">{req.reference} · {req.serviceCategory} · {formatDate(req.createdAt)}</p>
            <h1 className="mt-1 text-xl font-bold text-stone-900 font-display [overflow-wrap:anywhere] sm:text-2xl">{req.title}</h1>
            <p className="mt-1 text-sm text-stone-600">{req.customer.displayName} · {req.location || req.city}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {req.invited && <StatusBadge label="Sent to you" tone="info" />}
            <StatusBadge {...s} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void contact()} disabled={busy} className="dbc-btn dbc-btn-secondary min-h-[44px]">Message customer</button>
          {quotable && !quote && !form && <button type="button" onClick={startQuote} className="dbc-btn dbc-btn-primary min-h-[44px]">Prepare quotation</button>}
        </div>
      </header>

      {notice && <p className={`rounded-xl p-3 text-sm ${notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-800'}`} role={notice.tone === 'ok' ? 'status' : 'alert'}>{notice.text}</p>}

      {/* Existing quotation */}
      {quote && qs && (
        <section aria-labelledby="pq-mine" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pq-mine" className="text-base font-semibold text-stone-900">Your quotation</h2>
            <StatusBadge label={qs.label} tone={qs.tone} />
          </div>
          <p className="mt-2 text-sm text-stone-700">{quote.proposal?.title} · <span className="font-semibold">{formatINR(quote.totalAmount)}</span> · {quote.estimatedDurationDays} days</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.status === 'DRAFT' && quotable && <button type="button" onClick={() => void submitDraft()} disabled={busy} className="dbc-btn dbc-btn-primary min-h-[44px]">Send to customer</button>}
            {quote.status === 'DRAFT' && <button type="button" onClick={() => void deleteDraft()} disabled={busy} className="dbc-btn dbc-btn-secondary min-h-[44px]">Delete draft</button>}
            {WITHDRAWABLE.includes(quote.status) && <button type="button" onClick={() => void withdraw()} disabled={busy} className="dbc-btn dbc-btn-secondary min-h-[44px]">Withdraw</button>}
          </div>
          {quote.status === 'ACCEPTED' && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Accepted — the project has been created. Find it under <Link to="/workspace/projects" className="font-semibold underline">Projects</Link>.</p>}
        </section>
      )}

      {/* Quotation form */}
      {form && (
        <section aria-labelledby="pq-form" className="space-y-5 rounded-3xl border border-emerald-700/30 bg-white p-5 sm:p-6">
          <div>
            <h2 id="pq-form" className="text-base font-semibold text-stone-900">Prepare quotation</h2>
            <p className="mt-1 text-sm text-stone-600">Base it on the customer's requirements and anything agreed in messages. You can save a draft first.</p>
          </div>
          <F id="pq-title" label="Quotation title" error={errors.title}><input id="pq-title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls(errors.title)} /></F>
          <F id="pq-summary" label="Summary" error={errors.summary}><textarea id="pq-summary" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputCls(errors.summary)} /></F>
          <F id="pq-scope" label="Scope of work" error={errors.scope}><textarea id="pq-scope" rows={4} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={inputCls(errors.scope)} /></F>
          <F id="pq-deliv" label="Deliverables" error={errors.deliverables}><textarea id="pq-deliv" rows={3} value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} className={inputCls(errors.deliverables)} /></F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="pq-assume" label="Assumptions" optional><textarea id="pq-assume" rows={2} value={form.assumptions} onChange={(e) => setForm({ ...form, assumptions: e.target.value })} className={inputCls()} /></F>
            <F id="pq-excl" label="Exclusions" optional><textarea id="pq-excl" rows={2} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} className={inputCls()} /></F>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-stone-900">Pricing</legend>
            <div className="flex flex-wrap gap-2">
              {(['FIXED', 'MILESTONE_BASED'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={form.priceModel === m} onClick={() => setForm({ ...form, priceModel: m })} className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${form.priceModel === m ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300 bg-white text-stone-800'}`}>
                  {m === 'FIXED' ? 'Fixed price' : 'Milestone based'}
                </button>
              ))}
            </div>
            {form.priceModel === 'FIXED' ? (
              <F id="pq-total" label="Total amount (₹)" error={errors.totalAmount}>
                <input id="pq-total" inputMode="decimal" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value.replace(/[^\d.]/g, '') })} className={inputCls(errors.totalAmount)} />
              </F>
            ) : (
              <div className="space-y-3">
                {form.milestones.map((m, i) => (
                  <div key={i} className="grid gap-2 rounded-2xl border border-stone-200 p-3 sm:grid-cols-[1fr_9rem_7rem_auto] sm:items-start">
                    <F id={`pq-m${i}n`} label={`Milestone ${i + 1}`} error={errors[`m${i}name`]}><input id={`pq-m${i}n`} value={m.name} onChange={(e) => setForm({ ...form, milestones: form.milestones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} className={inputCls(errors[`m${i}name`])} /></F>
                    <F id={`pq-m${i}c`} label="Cost (₹)" error={errors[`m${i}cost`]}><input id={`pq-m${i}c`} inputMode="decimal" value={m.cost} onChange={(e) => setForm({ ...form, milestones: form.milestones.map((x, j) => (j === i ? { ...x, cost: e.target.value.replace(/[^\d.]/g, '') } : x)) })} className={inputCls(errors[`m${i}cost`])} /></F>
                    <F id={`pq-m${i}d`} label="Days" optional><input id={`pq-m${i}d`} inputMode="numeric" value={m.durationDays} onChange={(e) => setForm({ ...form, milestones: form.milestones.map((x, j) => (j === i ? { ...x, durationDays: e.target.value.replace(/\D/g, '') } : x)) })} className={inputCls()} /></F>
                    {form.milestones.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, milestones: form.milestones.filter((_, j) => j !== i) })} className="min-h-[44px] self-end text-sm font-semibold text-rose-700 hover:underline" aria-label={`Remove milestone ${i + 1}`}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, milestones: [...form.milestones, { name: '', cost: '', durationDays: '' }] })} className="min-h-[40px] text-sm font-semibold text-emerald-800 hover:underline">+ Add milestone</button>
                <p className="text-sm text-stone-700">Total: <span className="font-semibold">{formatINR(milestoneSum)}</span> <span className="text-stone-600">(sum of milestones)</span></p>
              </div>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <F id="pq-days" label="Estimated duration (days)" error={errors.durationDays}><input id="pq-days" inputMode="numeric" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value.replace(/\D/g, '') })} className={inputCls(errors.durationDays)} /></F>
            <F id="pq-warranty" label="Warranty (months)" error={errors.warrantyMonths} optional><input id="pq-warranty" inputMode="numeric" value={form.warrantyMonths} onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value.replace(/\D/g, '') })} className={inputCls(errors.warrantyMonths)} /></F>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
            <button type="button" onClick={() => { setForm(null); setErrors({}); }} className="dbc-btn dbc-btn-ghost min-h-[44px]">Cancel</button>
            <button type="button" onClick={() => void sendQuote(false)} disabled={busy} className="dbc-btn dbc-btn-secondary min-h-[44px]">Save draft</button>
            <button type="button" onClick={() => void sendQuote(true)} disabled={busy} className="dbc-btn dbc-btn-primary min-h-[44px]">{busy ? 'Sending…' : 'Send quotation'}</button>
          </div>
        </section>
      )}

      {!quotable && !quote && <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">This request is no longer accepting quotations.</p>}

      {/* Requirements */}
      <section aria-labelledby="pq-req" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 id="pq-req" className="text-base font-semibold text-stone-900">Customer requirements</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{text}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-stone-600">Budget</dt><dd className="font-medium text-stone-900">{details.find(([k]) => k === 'Budget')?.[1] ?? formatBudget(req.budgetMin, req.budgetMax)}</dd></div>
          <div><dt className="text-stone-600">Location</dt><dd className="font-medium text-stone-900 [overflow-wrap:anywhere]">{req.location || req.city}{!req.engaged && <span className="block text-xs font-normal text-stone-600">Full site address is shared once you message the customer.</span>}</dd></div>
          {details.filter(([k]) => k !== 'Budget').map(([k, v]) => <div key={k}><dt className="text-stone-600">{k}</dt><dd className="font-medium text-stone-900">{v}</dd></div>)}
        </dl>
        {req.attachments.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {req.attachments.map((a) => <li key={a.id}><a href={a.fileUrl} target="_blank" rel="noreferrer"><img src={a.fileUrl} alt={a.fileName} loading="lazy" className="aspect-square w-full rounded-xl bg-stone-100 object-cover" /></a></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
