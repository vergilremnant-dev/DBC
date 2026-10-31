import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useServiceCatalog, workforceLabel } from '../../hooks/marketplace/useServiceCatalog';
import { useProviderResults } from '../../hooks/marketplace/useProviderResults';
import { providerApi } from '../../services/provider/providerService';
import { profileService } from '../../services/profile/profileService';
import { projectRequestApi, type ApiError, type ProjectRequestSubmitted } from '../../services/projectRequest/projectRequestService';
import type { ProviderProfile } from '../../types/provider/providerTypes';
import { SUPPORTED_CITIES } from '../../config/locations';
import { ServiceIcon } from '../../components/marketplace/ServiceIcon';

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */

const STEPS = ['Service', 'Project', 'Site & budget', 'Photos', 'Review'] as const;
const DRAFT_KEY = 'dbc_project_request_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const PROPERTY_TYPES = ['Independent house', 'Apartment', 'Villa', 'Commercial', 'Plot / land', 'Other'];
const TIMELINES = ['As soon as possible', 'Within 1 month', 'In 1–3 months', 'In 3–6 months', 'Flexible'];
const BUDGETS: Array<{ label: string; min: number; max: number }> = [
  { label: 'Not sure yet', min: 0, max: 0 },
  { label: 'Under ₹50,000', min: 0, max: 50000 },
  { label: '₹50,000 – ₹2 lakh', min: 50000, max: 200000 },
  { label: '₹2 – 5 lakh', min: 200000, max: 500000 },
  { label: '₹5 – 10 lakh', min: 500000, max: 1000000 },
  { label: '₹10 – 25 lakh', min: 1000000, max: 2500000 },
  { label: 'Above ₹25 lakh', min: 2500000, max: 2500000 },
];

/** Questions differ by workforce group so an architect and an electrician aren't asked the same things. */
type Question = { key: string; label: string; kind: 'select' | 'text'; options?: string[]; placeholder?: string; help?: string };
const QUESTIONS: Record<'WHITE_COLLAR' | 'BLUE_COLLAR', Question[]> = {
  WHITE_COLLAR: [
    { key: 'propertyType', label: 'Property type', kind: 'select', options: PROPERTY_TYPES },
    { key: 'stage', label: 'Project stage', kind: 'select', options: ['Idea / planning', 'Need designs or drawings', 'Need approvals', 'Under construction', 'Renovation of existing building'] },
    { key: 'area', label: 'Plot or built-up area', kind: 'text', placeholder: 'e.g. 1,200 sq ft or 30×40 plot', help: 'An approximate size helps professionals estimate effort.' },
  ],
  BLUE_COLLAR: [
    { key: 'workType', label: 'Type of work', kind: 'select', options: ['New installation', 'Repair', 'Replacement', 'Renovation'] },
    { key: 'propertyType', label: 'Property type', kind: 'select', options: PROPERTY_TYPES },
    { key: 'area', label: 'Area or quantity', kind: 'text', placeholder: 'e.g. 2 bathrooms, 600 sq ft, 8 windows', help: 'Rough numbers are fine.' },
  ],
};

/** Example text per service slug (artwork-style hints only; labels come from the API). */
const EXAMPLES: Record<string, string> = {
  architect: 'e.g. Design a G+2 house on a 30×40 east-facing plot with parking and 3 bedrooms.',
  'interior-designer': 'e.g. Full interiors for a 3BHK apartment — modular kitchen, wardrobes and false ceiling.',
  'structural-engineer': 'e.g. Structural design and drawings for a G+1 residential building.',
  electrical: 'e.g. Rewire a 2BHK apartment and install new switchboards and lighting points.',
  plumbing: 'e.g. Replace bathroom pipelines and fittings in two bathrooms.',
  waterproofing: 'e.g. Terrace leakage during rains; need waterproofing for about 900 sq ft.',
  painting: 'e.g. Interior painting for a 3BHK, walls and ceilings, with putty work.',
  carpentry: 'e.g. Wardrobes for two bedrooms and a TV unit.',
  tiles: 'e.g. Replace floor tiles in the living room and kitchen, about 500 sq ft.',
};

interface FormState {
  serviceSlug: string;
  providerId: string;
  title: string;
  description: string;
  answers: Record<string, string>;
  siteAddress: string;
  city: string;
  timeline: string;
  budget: string;
}

const emptyForm = (serviceSlug: string, providerId: string, city: string): FormState => ({
  serviceSlug,
  providerId,
  title: '',
  description: '',
  answers: {},
  siteAddress: '',
  city,
  timeline: '',
  budget: '',
});

type Photo = { fileName: string; fileUrl: string; fileType: string; size: number };

/**
 * A draft belongs to the account that wrote it (or to a guest, ownerId null, until they sign in).
 * A draft written by another signed-in account on this browser is discarded, never shown.
 */
function readDraft(currentUserId: string | null): { form: FormState; step: number; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.ownerId && d.ownerId !== currentUserId) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return Date.now() - d.savedAt < DRAFT_TTL_MS ? d : null;
  } catch {
    return null;
  }
}
function writeDraft(form: FormState, step: number, ownerId: string | null) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt: Date.now(), ownerId }));
  } catch {
    /* storage unavailable: the form still works, it just won't survive a reload */
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(file);
  });

/** Photos travel inline with the request, so the set must stay under the server's total (see MAX_ATTACHMENT_TOTAL_CHARS). */
const MAX_PHOTOS_TOTAL_CHARS = 3_000_000;
const MAX_PHOTO_EDGE = 1600;

/**
 * Downscale a photo to at most 1600px on its longest side and re-encode it as JPEG, so that a full set of
 * site photos fits in one request. Falls back to the original image if the browser cannot decode it.
 */
async function compressPhoto(file: File): Promise<{ dataUrl: string; type: string }> {
  const original = await fileToDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = original;
    });
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: original, type: file.type };
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL('image/jpeg', 0.82);
    return jpeg.length < original.length ? { dataUrl: jpeg, type: 'image/jpeg' } : { dataUrl: original, type: file.type };
  } catch {
    return { dataUrl: original, type: file.type };
  }
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Field({ id, label, error, help, optional, children }: { id: string; label: string; error?: string; help?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-stone-900">
        {label} {optional && <span className="font-normal text-stone-600">(optional)</span>}
      </label>
      {children}
      {help && !error && <p id={`${id}-help`} className="text-xs text-stone-600">{help}</p>}
      {error && <p id={`${id}-error`} className="text-xs font-medium text-rose-700" role="alert">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-xs outline-none transition placeholder:text-stone-500 focus:ring-2 sm:text-sm ${
    err ? 'border-rose-500 focus:ring-rose-500/20' : 'border-stone-300 focus:border-emerald-700 focus:ring-emerald-700/20'
  }`;

function Choice({ name, value, current, onSelect, title, text }: { name: string; value: string; current: string; onSelect: (v: string) => void; title: string; text?: string }) {
  const on = current === value;
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${on ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
      <input type="radio" name={name} value={value} checked={on} onChange={() => onSelect(value)} className="mt-1 h-4 w-4 accent-emerald-700" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-900">{title}</span>
        {text && <span className="mt-0.5 block text-sm text-stone-600">{text}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/** /request-project?service=<slug>&professional=<id> — structured project request (no appointment slots). */
export function RequestProjectPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const currentUserId = user?.id != null ? String(user.id) : null;
  const { categories, bySlug, byId, status: catalogStatus } = useServiceCatalog();

  const urlProfessional = params.get('professional') || params.get('providerId') || '';
  const urlService = params.get('service') || '';
  const urlCategoryId = Number(params.get('categoryId')) || 0;

  const [form, setForm] = useState<FormState>(() => {
    const d = readDraft(currentUserId);
    if (d && (!urlService || d.form.serviceSlug === urlService) && (!urlProfessional || d.form.providerId === urlProfessional)) return d.form;
    return emptyForm(urlService, urlProfessional, params.get('city') || '');
  });
  const [step, setStep] = useState<number>(() => {
    const d = readDraft(currentUserId);
    return d && params.get('resume') === '1' ? Math.min(d.step, STEPS.length - 1) : 0;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState<ProjectRequestSubmitted | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Legacy links (?categoryId=) resolve to the service slug once the catalog is loaded.
  const [legacyResolved, setLegacyResolved] = useState(false);
  if (!legacyResolved && !form.serviceSlug && urlCategoryId && catalogStatus === 'ready') {
    setLegacyResolved(true);
    const c = byId.get(urlCategoryId);
    if (c) setForm((f) => ({ ...f, serviceSlug: c.slug }));
  }

  const service = bySlug.get(form.serviceSlug) ?? null;

  // Selected professional (public profile fields only).
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [providerState, setProviderState] = useState<'none' | 'loading' | 'ready' | 'error'>(form.providerId ? 'loading' : 'none');
  useEffect(() => {
    if (!form.providerId) return;
    let alive = true;
    providerApi
      .getProvider(form.providerId)
      .then((p) => {
        if (!alive) return;
        setProvider(p);
        setProviderState('ready');
        // The professional's own service wins over a mismatched link.
        if (p.category?.slug) setForm((f) => (f.serviceSlug === p.category!.slug ? f : { ...f, serviceSlug: p.category!.slug }));
      })
      .catch(() => alive && setProviderState('error'));
    return () => {
      alive = false;
    };
  }, [form.providerId]);

  // Professionals for this service (when the customer wants to choose one).
  const pros = useProviderResults({ categoryId: service?.id, city: form.city || undefined, limit: 12 }, !!service && !form.providerId && step === 0);

  // Persist the draft (text only) so sign-in or a reload doesn't lose it.
  useEffect(() => {
    if (!done) writeDraft(form, step, currentUserId);
  }, [form, step, done, currentUserId]);

  // Move focus to the heading when the step changes (not on first load) so screen readers announce it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: false });
  }, [step, done]);

  const group = (service?.categoryType ?? 'BLUE_COLLAR') as 'WHITE_COLLAR' | 'BLUE_COLLAR';
  const questions = QUESTIONS[group];
  const budget = BUDGETS.find((b) => b.label === form.budget);
  const isCustomer = isAuthenticated && user?.role === 'ROLE_CUSTOMER';
  const wrongRole = isAuthenticated && !isCustomer;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k as string];
      return n;
    });
  };

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!service) e.serviceSlug = 'Choose a service.';
      if (form.providerId && providerState === 'error') e.providerId = 'This professional is not available. Choose another or send an open request.';
    }
    if (s === 1) {
      if (form.title.trim().length < 5) e.title = 'Add a short title (at least 5 characters).';
      if (form.description.trim().length < 20) e.description = 'Describe the work in at least 20 characters.';
    }
    if (s === 2) {
      if (!form.siteAddress.trim()) e.siteAddress = 'Add the site address or area.';
      if (!form.city) e.city = 'Choose the city.';
      if (!form.timeline) e.timeline = 'Choose when you would like to start.';
      if (!form.budget) e.budget = 'Choose a budget range (or “Not sure yet”).';
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const signInHref = () => {
    const p = new URLSearchParams(location.search);
    if (form.serviceSlug) p.set('service', form.serviceSlug);
    if (form.providerId) p.set('professional', form.providerId);
    else p.delete('professional');
    p.set('resume', '1');
    return `/login?redirect=${encodeURIComponent(`/request-project?${p.toString()}`)}`;
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErrors((e) => ({ ...e, photos: '' }));
    const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    let usedChars = photos.reduce((n, p) => n + p.fileUrl.length, 0);
    for (const f of list) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        setErrors((e) => ({ ...e, photos: `${f.name}: only JPEG, PNG or WEBP images are supported.` }));
        continue;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setErrors((e) => ({ ...e, photos: `${f.name} is larger than 2 MB.` }));
        continue;
      }
      setUploading(true);
      try {
        const { dataUrl, type } = await compressPhoto(f);
        if (usedChars + dataUrl.length > MAX_PHOTOS_TOTAL_CHARS) {
          setErrors((e) => ({ ...e, photos: `${f.name} would make the photos too large together. Remove a photo or use a smaller image.` }));
          continue;
        }
        const res = await profileService.uploadImage(dataUrl, 'requirements');
        if (!res?.url) throw new Error('Upload failed');
        usedChars += res.url.length;
        setPhotos((p) => [...p, { fileName: f.name, fileUrl: res.url, fileType: type, size: Math.round((dataUrl.length * 3) / 4) }]);
      } catch {
        setErrors((e) => ({ ...e, photos: `Could not upload ${f.name}. Please try again.` }));
      } finally {
        setUploading(false);
      }
    }
  };

  const submit = async () => {
    if (submittingRef.current) return;
    for (const s of [0, 1, 2]) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    if (!service) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const details: Record<string, string> = {};
      for (const q of questions) if (form.answers[q.key]) details[q.label] = form.answers[q.key];
      details['Preferred start'] = form.timeline;
      if (budget) details['Budget'] = budget.label;
      const res = await projectRequestApi.submit({
        serviceCategoryId: service.id,
        providerId: form.providerId || null,
        title: form.title.trim(),
        description: form.description.trim(),
        siteAddress: form.siteAddress.trim(),
        city: form.city,
        budgetMin: budget?.min ?? 0,
        budgetMax: budget?.max ?? 0,
        details,
        attachments: photos.map(({ fileName, fileUrl, fileType }) => ({ fileName, fileUrl, fileType })),
      });
      clearDraft();
      setDone(res);
    } catch (err) {
      const e = err as ApiError;
      setSubmitError(e.message || 'Could not submit your request. Please try again.');
      if (e.fields) setErrors(e.fields);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const proName = provider ? provider.businessName || provider.fullName : '';

  /* ---------------------------- Success ---------------------------- */
  if (done) {
    return (
      <div className="dbc-container py-8 sm:py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-bold text-stone-900 font-display outline-none">
            {done.duplicate ? 'Request already submitted' : 'Request submitted'}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Reference <span className="font-semibold text-stone-900">{done.reference}</span>
          </p>
          <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-left text-sm text-stone-700">
            <p className="font-semibold text-stone-900">What happens next</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>{proName ? `${proName} reviews your request.` : `${service?.name ?? 'Matching'} professionals review your request.`}</li>
              <li>They may message you with questions before quoting.</li>
              <li>You compare quotations and accept the one you prefer — nothing is booked until you do.</li>
            </ol>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link to={`/workspace/requests/${done.id}`} className="dbc-btn dbc-btn-primary min-h-[44px]">View request</Link>
            {done.conversationId ? (
              <Link to={`/workspace/inbox?conversation=${done.conversationId}`} className="dbc-btn dbc-btn-secondary min-h-[44px]">Message {proName || 'professional'}</Link>
            ) : (
              <Link to="/" className="dbc-btn dbc-btn-secondary min-h-[44px]">Back to marketplace</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------- Form ------------------------------ */
  return (
    <div className="dbc-container py-5 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Project request</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-stone-900 font-display outline-none">
            {STEPS[step] === 'Review' ? 'Review your request' : proName ? `Request a quote from ${proName}` : service ? `Request ${service.name} quotes` : 'Start a project request'}
          </h1>
        </div>

        {/* Progress */}
        <nav aria-label="Progress">
          <p className="mb-2 text-xs font-semibold text-stone-700 sm:hidden" aria-hidden="true">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <ol className="grid grid-cols-5 gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? 'step' : undefined} className="min-w-0">
                <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-emerald-700' : 'bg-stone-200'}`} />
                <span className={`mt-1.5 hidden truncate text-xs sm:block ${i === step ? 'font-semibold text-stone-900' : 'text-stone-600'}`}>{s}</span>
                <span className="sr-only">Step {i + 1} of {STEPS.length}: {s}{i < step ? ' (done)' : ''}</span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Context: service + professional */}
        {service && step > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ServiceIcon slug={service.slug} className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-stone-900">{service.name}</p>
              <p className="truncate text-stone-600">{proName ? `To ${proName}` : `Open request to ${service.name} professionals`}</p>
            </div>
            <button type="button" onClick={() => setStep(0)} className="min-h-[44px] shrink-0 rounded-lg px-2 text-sm font-semibold text-emerald-800 hover:underline">Change</button>
          </div>
        )}

        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="step-title">
          <h2 id="step-title" className="sr-only">{STEPS[step]}</h2>

          {/* STEP 1 — Service & professional */}
          {step === 0 && (
            <div className="space-y-5">
              <Field id="rq-service" label="Service" error={errors.serviceSlug}>
                <select
                  id="rq-service"
                  value={form.serviceSlug}
                  onChange={(e) => {
                    set('serviceSlug', e.target.value);
                    if (provider && provider.category?.slug !== e.target.value) {
                      set('providerId', '');
                      setProvider(null);
                      setProviderState('none');
                    }
                  }}
                  disabled={catalogStatus !== 'ready'}
                  className={inputCls(errors.serviceSlug)}
                  aria-invalid={!!errors.serviceSlug}
                >
                  <option value="">{catalogStatus === 'loading' ? 'Loading services…' : 'Choose a service'}</option>
                  {(['WHITE_COLLAR', 'BLUE_COLLAR'] as const).map((g) => (
                    <optgroup key={g} label={workforceLabel(g)}>
                      {categories.filter((c) => c.categoryType === g).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>

              {form.providerId ? (
                <div className="rounded-2xl border border-stone-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Professional</p>
                  {providerState === 'loading' && <p className="mt-1 text-sm text-stone-600" role="status">Loading professional…</p>}
                  {providerState === 'error' && <p className="mt-1 text-sm text-rose-700" role="alert">{errors.providerId || 'This professional could not be loaded.'}</p>}
                  {provider && (
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 [overflow-wrap:anywhere]">{proName}</p>
                        <p className="text-sm text-stone-600">{[provider.category?.name, provider.city].filter(Boolean).join(' · ')}</p>
                      </div>
                      <Link to={`/professional/${provider.id}`} className="shrink-0 text-sm font-semibold text-emerald-800 hover:underline">Profile</Link>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      set('providerId', '');
                      setProvider(null);
                      setProviderState('none');
                    }}
                    className="mt-3 min-h-[40px] text-sm font-semibold text-stone-700 underline"
                  >
                    Send to all {service?.name ?? ''} professionals instead
                  </button>
                </div>
              ) : (
                service && (
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-semibold text-stone-900">Who should receive this request?</legend>
                    <Choice name="rq-target" value="" current="" onSelect={() => undefined} title={`All ${service.name} professionals`} text="Any professional for this service can review it and send a quotation." />
                    {pros.status === 'ready' && pros.items.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm text-stone-600">Or send it to one professional:</p>
                        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                          {pros.items.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setProvider(p);
                                  setProviderState('ready');
                                  set('providerId', p.id);
                                }}
                                className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-left hover:border-emerald-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-stone-900">{p.businessName || p.fullName}</span>
                                  <span className="block truncate text-xs text-stone-600">{[p.city, p.experienceYears > 0 ? `${p.experienceYears} yrs` : ''].filter(Boolean).join(' · ')}</span>
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-emerald-800">Choose</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </fieldset>
                )
              )}
            </div>
          )}

          {/* STEP 2 — Project details */}
          {step === 1 && (
            <div className="space-y-5">
              <Field id="rq-title" label="Request title" error={errors.title} help="A one-line summary, e.g. “Rewiring for a 2BHK apartment”.">
                <input id="rq-title" value={form.title} maxLength={120} onChange={(e) => set('title', e.target.value)} className={inputCls(errors.title)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'rq-title-error' : 'rq-title-help'} />
              </Field>
              <Field id="rq-desc" label="Describe the work" error={errors.description} help={`${form.description.trim().length}/4000 · Include what you need, the current condition and anything special.`}>
                <textarea id="rq-desc" rows={5} value={form.description} maxLength={4000} onChange={(e) => set('description', e.target.value)} placeholder={EXAMPLES[form.serviceSlug] ?? 'Describe the scope of work you need help with.'} className={inputCls(errors.description)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'rq-desc-error' : 'rq-desc-help'} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {questions.map((q) => (
                  <Field key={q.key} id={`rq-${q.key}`} label={q.label} help={q.help} optional>
                    {q.kind === 'select' ? (
                      <select id={`rq-${q.key}`} value={form.answers[q.key] ?? ''} onChange={(e) => set('answers', { ...form.answers, [q.key]: e.target.value })} className={inputCls()}>
                        <option value="">Select</option>
                        {q.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input id={`rq-${q.key}`} value={form.answers[q.key] ?? ''} maxLength={120} placeholder={q.placeholder} onChange={(e) => set('answers', { ...form.answers, [q.key]: e.target.value })} className={inputCls()} />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Site, timeline, budget */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
                <Field id="rq-site" label="Site address or area" error={errors.siteAddress} help="Shared only with professionals you engage with.">
                  <input id="rq-site" value={form.siteAddress} maxLength={300} onChange={(e) => set('siteAddress', e.target.value)} placeholder="e.g. Plot 12, Kondapur" className={inputCls(errors.siteAddress)} aria-invalid={!!errors.siteAddress} />
                </Field>
                <Field id="rq-city" label="City" error={errors.city}>
                  <select id="rq-city" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls(errors.city)} aria-invalid={!!errors.city}>
                    <option value="">Select</option>
                    {SUPPORTED_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-stone-900">When would you like to start?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIMELINES.map((t) => (
                    <button key={t} type="button" onClick={() => set('timeline', t)} aria-pressed={form.timeline === t} className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${form.timeline === t ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {errors.timeline && <p className="mt-1.5 text-xs font-medium text-rose-700" role="alert">{errors.timeline}</p>}
              </fieldset>
              <Field id="rq-budget" label="Estimated budget" error={errors.budget} help="A range helps professionals propose the right scope. You'll agree the final price in their quotation.">
                <select id="rq-budget" value={form.budget} onChange={(e) => set('budget', e.target.value)} className={inputCls(errors.budget)} aria-invalid={!!errors.budget}>
                  <option value="">Select a range</option>
                  {BUDGETS.map((b) => <option key={b.label} value={b.label}>{b.label}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* STEP 4 — Photos (sign-in required to upload and submit) */}
          {step === 3 && (
            <div className="space-y-4">
              {!isAuthenticated ? (
                <div className="rounded-2xl bg-stone-50 p-5 text-center">
                  <p className="text-sm font-semibold text-stone-900">Sign in to add photos and send your request</p>
                  <p className="mt-1 text-sm text-stone-600">Your answers are saved on this device and will be here when you return.</p>
                  <Link to={signInHref()} className="dbc-btn dbc-btn-primary mt-4 min-h-[44px]">Sign in or create account</Link>
                </div>
              ) : wrongRole ? (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">Project requests are sent from customer accounts. Please sign in with a customer account to continue.</p>
              ) : (
                <>
                  <p className="text-sm text-stone-700">Add up to {MAX_PHOTOS} photos of the site or reference images (JPEG, PNG or WEBP, up to 2 MB each). This step is optional.</p>
                  <label className={`flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-4 text-center transition ${photos.length >= MAX_PHOTOS ? 'cursor-not-allowed opacity-60' : 'border-stone-300 hover:border-emerald-700'}`}>
                    <span className="text-sm font-semibold text-emerald-800">{uploading ? 'Uploading…' : 'Choose photos'}</span>
                    <span className="text-xs text-stone-600">{photos.length}/{MAX_PHOTOS} added</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading || photos.length >= MAX_PHOTOS} onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
                  </label>
                  {errors.photos && <p className="text-xs font-medium text-rose-700" role="alert">{errors.photos}</p>}
                  {photos.length > 0 && (
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {photos.map((p, i) => (
                        <li key={p.fileUrl.slice(-24) + i} className="relative">
                          <img src={p.fileUrl} alt={p.fileName} className="aspect-square w-full rounded-xl bg-stone-100 object-cover" />
                          <button type="button" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/80 text-white" aria-label={`Remove ${p.fileName}`}>×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 5 — Review */}
          {step === 4 && (
            <div className="space-y-5 text-sm">
              {!isCustomer && (
                <p className="rounded-2xl bg-amber-50 p-4 text-amber-900" role="alert">
                  {isAuthenticated ? 'Please sign in with a customer account to submit.' : 'Please sign in to submit your request.'}{' '}
                  {!isAuthenticated && <Link to={signInHref()} className="font-semibold underline">Sign in</Link>}
                </p>
              )}
              <dl className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
                {[
                  ['Service', service?.name ?? '—', 0],
                  ['Sent to', proName || `All ${service?.name ?? ''} professionals`, 0],
                  ['Title', form.title, 1],
                  ['Description', form.description, 1],
                  ...questions.filter((q) => form.answers[q.key]).map((q) => [q.label, form.answers[q.key], 1] as [string, string, number]),
                  ['Site', [form.siteAddress, form.city].filter(Boolean).join(', '), 2],
                  ['Preferred start', form.timeline, 2],
                  ['Budget', form.budget, 2],
                  ['Photos', photos.length ? `${photos.length} attached` : 'None', 3],
                  ...(isCustomer ? ([['Your contact', [[user?.firstName, user?.lastName].filter(Boolean).join(' '), user?.phone || user?.email].filter(Boolean).join(' · '), -1]] as [string, string, number][]) : []),
                ].map(([k, v, s]) => (
                  <div key={String(k)} className="grid grid-cols-[7.5rem_1fr_auto] items-start gap-3 px-4 py-3 sm:grid-cols-[9rem_1fr_auto]">
                    <dt className="text-stone-600">{k}</dt>
                    <dd className="whitespace-pre-line text-stone-900 [overflow-wrap:anywhere]">{v || '—'}</dd>
                    {Number(s) >= 0 ? (
                      <button type="button" onClick={() => setStep(Number(s))} className="text-xs font-semibold text-emerald-800 hover:underline" aria-label={`Edit ${k}`}>Edit</button>
                    ) : <span />}
                  </div>
                ))}
              </dl>
              <p className="text-xs text-stone-600">Submitting sends your request for quotations. No payment is taken and no professional is booked until you accept a quotation.</p>
              {submitError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{submitError}</p>}
            </div>
          )}
        </section>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={back} className="dbc-btn dbc-btn-secondary min-h-[44px] px-5">Back</button>
          ) : (
            <Link to={service ? `/services/${service.slug}` : '/services'} className="dbc-btn dbc-btn-ghost min-h-[44px] px-3">Cancel</Link>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={step === 3 && uploading} className="dbc-btn dbc-btn-primary min-h-[44px] px-6">
              {step === 3 && !photos.length ? 'Skip & review' : 'Continue'}
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting || !isCustomer} className="dbc-btn dbc-btn-primary min-h-[44px] px-6">
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

