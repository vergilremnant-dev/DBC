import { useState } from 'react';
import { useAuth } from '../../../hooks/auth/useAuth';
import { useOwnProfile, profileSaveErrors } from '../../../hooks/profile/useOwnProfile';

/** The signed-in professional's own profile, as returned by GET /api/profile (resolved from the access token). */
interface ProviderProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  businessName: string | null;
  description: string | null;
  experienceYears: number;
  city: string;
  state: string;
  serviceAreas: string | null;
  categoryId: number;
  category?: { id: number; name: string } | null;
  phoneNumber: string | null;
  email?: string;
  profileImage: string | null;
  coverImage: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  canProvideServices: boolean;
  canProvideConsultation: boolean;
  consultationFee: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

type EditableFields = 'fullName' | 'businessName' | 'description' | 'experienceYears' | 'city' | 'state' | 'serviceAreas' | 'consultationFee';
type FormValues = Record<EditableFields, string>;

const VERIFICATION: Record<ProviderProfileRecord['verificationStatus'], { label: string; tone: string; note: string }> = {
  VERIFIED: { label: 'Verified by DBC', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', note: 'Your profile is public and you can respond to project requests.' },
  PENDING: { label: 'Awaiting verification', tone: 'bg-amber-50 text-amber-800 border-amber-200', note: 'DBC is reviewing your profile. It becomes public, and you can respond to project requests, once verified.' },
  REJECTED: { label: 'Not approved', tone: 'bg-rose-50 text-rose-800 border-rose-200', note: 'Your profile was not approved. Please contact DBC support.' },
};

const MISSING_LABELS: Record<string, string> = {
  fullName: 'Add your full name',
  phoneNumber: 'Add your phone number',
  city: 'Add your city',
  state: 'Add your state',
  experienceYears: 'Add your years of experience',
  categoryId: 'Choose your service',
  consultationFee: 'Set your consultation fee',
};

const toForm = (p: ProviderProfileRecord | null): FormValues => ({
  fullName: p?.fullName ?? '',
  businessName: p?.businessName ?? '',
  description: p?.description ?? '',
  experienceYears: p ? String(p.experienceYears ?? '') : '',
  city: p?.city ?? '',
  state: p?.state ?? '',
  serviceAreas: p?.serviceAreas ?? '',
  consultationFee: p ? String(p.consultationFee ?? 0) : '0',
});

/**
 * Professional profile. Shows and edits only the signed-in professional's own record; nothing is invented or
 * shared between accounts. Remounted per account (see the default export).
 */
function OwnProfessionalProfile() {
  const { user } = useAuth();
  const own = useOwnProfile<ProviderProfileRecord>();
  const profile = own.status === 'ready' ? own.profile : null;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<FormValues>(toForm(null));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ fields: Record<string, string>; message: string }>({ fields: {}, message: '' });
  const [notice, setNotice] = useState('');

  if (own.status === 'loading') return <SkeletonProfile />;
  if (own.status === 'error') {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl border border-stone-200 bg-white p-6 text-center" role="alert">
        <p className="text-sm text-stone-700">{own.error}</p>
        <button type="button" onClick={own.reload} className="dbc-btn dbc-btn-md dbc-btn-secondary mt-3">Try again</button>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl border border-stone-200 bg-white p-6 text-center">
        <h1 className="text-lg font-bold text-stone-900">Your professional profile isn't set up yet</h1>
        <p className="mt-1 text-sm text-stone-600">Please contact DBC support to complete your professional onboarding.</p>
      </div>
    );
  }

  const v = VERIFICATION[profile.verificationStatus] ?? VERIFICATION.PENDING;
  const pct = own.completion ? Math.max(0, Math.min(100, Math.round(own.completion.percentage))) : null;
  const startEdit = () => {
    setValues(toForm(profile));
    setErrors({ fields: {}, message: '' });
    setNotice('');
    setEditing(true);
  };
  const set = (k: EditableFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((x) => ({ ...x, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!values.fullName.trim()) local.fullName = 'Full name is required';
    if (!values.city.trim()) local.city = 'City is required';
    if (!values.state.trim()) local.state = 'State is required';
    if (!/^\d{1,2}$/.test(values.experienceYears.trim())) local.experienceYears = 'Enter years of experience (0–99)';
    if (profile.canProvideConsultation && !(Number(values.consultationFee) >= 0)) local.consultationFee = 'Enter a valid fee';
    if (Object.keys(local).length) return setErrors({ fields: local, message: 'Please correct the highlighted fields.' });
    setSaving(true);
    try {
      // Send the full record: unchanged values (service, phone, capabilities, images) are kept as they are.
      await own.save({
        fullName: values.fullName.trim(),
        businessName: values.businessName.trim() || null,
        description: values.description.trim() || null,
        experienceYears: Number(values.experienceYears),
        city: values.city.trim(),
        state: values.state.trim(),
        serviceAreas: values.serviceAreas.trim() || null,
        categoryId: profile.categoryId,
        phoneNumber: profile.phoneNumber,
        profileImage: profile.profileImage ?? undefined,
        coverImage: profile.coverImage ?? undefined,
        canProvideServices: profile.canProvideServices,
        canProvideConsultation: profile.canProvideConsultation,
        consultationFee: profile.canProvideConsultation ? Number(values.consultationFee) : profile.consultationFee,
      });
      setEditing(false);
      setNotice('Profile saved.');
    } catch (err) {
      setErrors(profileSaveErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (k: string) => errors.fields[k];
  const input = (k: EditableFields, label: string, opts: { textarea?: boolean; inputMode?: 'numeric' | 'decimal'; span?: boolean } = {}) => (
    <label className={`block space-y-1 ${opts.span ? 'sm:col-span-2' : ''}`}>
      <span className="text-2xs font-bold uppercase text-stone-600">{label}</span>
      {opts.textarea ? (
        <textarea name={k} value={values[k]} onChange={set(k)} rows={4} className="dbc-input w-full" aria-invalid={!!fieldError(k)} />
      ) : (
        <input name={k} value={values[k]} onChange={set(k)} inputMode={opts.inputMode} className="dbc-input w-full" aria-invalid={!!fieldError(k)} />
      )}
      {fieldError(k) && <span className="block text-2xs font-semibold text-rose-700" role="alert">{fieldError(k)}</span>}
    </label>
  );

  const details: [string, string | number | null | undefined][] = [
    ['Full name', profile.fullName],
    ['Business name', profile.businessName],
    ['Service', profile.category?.name],
    ['Experience', profile.experienceYears != null ? `${profile.experienceYears} years` : null],
    ['Location', [profile.city, profile.state].filter(Boolean).join(', ')],
    ['Service areas', profile.serviceAreas],
    ['Phone number', profile.phoneNumber],
    ['Sign-in email', user?.email],
    ...(profile.canProvideConsultation ? ([['Consultation fee', `₹${Number(profile.consultationFee || 0).toLocaleString('en-IN')}`]] as [string, string][]) : []),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-left">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex min-w-0 items-center gap-4">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-bold text-white" aria-hidden="true">
              {(profile.businessName || profile.fullName || 'DB').slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-black text-stone-900 font-display [overflow-wrap:anywhere]">{profile.businessName || profile.fullName}</h1>
            {profile.businessName && <p className="text-sm text-stone-600">{profile.fullName}</p>}
            <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${v.tone}`}>{v.label}</span>
          </div>
        </div>
        {!editing && (
          <button type="button" onClick={startEdit} className="dbc-btn dbc-btn-md dbc-btn-secondary">
            Edit profile
          </button>
        )}
      </header>

      <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{v.note}</p>
      {notice && <p className="rounded-xl border border-stone-200 bg-white p-3 text-xs font-semibold text-stone-700" role="status">{notice}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-8">
          {editing ? (
            <form onSubmit={save} noValidate className="space-y-4">
              <h2 className="border-b border-stone-100 pb-2 text-sm font-bold text-stone-900">Edit profile</h2>
              {errors.message && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{errors.message}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                {input('fullName', 'Full name', { span: true })}
                {input('businessName', 'Business name (optional)', { span: true })}
                {input('experienceYears', 'Years of experience', { inputMode: 'numeric' })}
                {profile.canProvideConsultation && input('consultationFee', 'Consultation fee (₹)', { inputMode: 'decimal' })}
                {input('city', 'City')}
                {input('state', 'State')}
                {input('serviceAreas', 'Service areas (optional)', { span: true })}
                {input('description', 'About your work (optional)', { textarea: true, span: true })}
              </div>
              <p className="text-2xs text-stone-500">
                Your service ({profile.category?.name ?? 'not set'}) and sign-in phone number can only be changed by DBC support, because verification is granted per service.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="dbc-btn dbc-btn-md dbc-btn-secondary" disabled={saving}>Cancel</button>
                <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="border-b border-stone-100 pb-2 text-sm font-bold text-stone-900">Profile details</h2>
              <dl className="grid gap-4 text-xs font-semibold text-stone-600 sm:grid-cols-2">
                {details.map(([label, value]) => (
                  <div key={label} className="space-y-0.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <dt className="text-3xs font-bold uppercase text-stone-500">{label}</dt>
                    <dd className="text-stone-900 [overflow-wrap:anywhere]">{value || 'Not added yet'}</dd>
                  </div>
                ))}
                <div className="space-y-0.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 sm:col-span-2">
                  <dt className="text-3xs font-bold uppercase text-stone-500">About your work</dt>
                  <dd className="leading-relaxed text-stone-700">{profile.description || 'Not added yet'}</dd>
                </div>
              </dl>
            </>
          )}
        </section>

        <aside className="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-4">
          <h2 className="text-sm font-bold text-stone-900">Profile strength</h2>
          {pct === null ? (
            <p className="text-xs text-stone-600">Not available right now.</p>
          ) : (
            <>
              <p className="text-2xl font-black text-stone-900">{pct}%</p>
              <div className="h-2 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="Profile completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-emerald-700" style={{ width: `${pct}%` }} />
              </div>
              {(own.completion?.missingFields ?? []).length > 0 && (
                <ul className="space-y-1 text-xs text-stone-700">
                  {own.completion!.missingFields.map((f) => <li key={f}>• {MISSING_LABELS[f] ?? 'Complete your profile'}</li>)}
                </ul>
              )}
            </>
          )}
          {profile.totalReviews > 0 && (
            <p className="text-xs text-stone-600">Rated {Number(profile.averageRating).toFixed(1)} from {profile.totalReviews} review{profile.totalReviews === 1 ? '' : 's'}.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

/** One instance per authenticated account, so state never carries over between accounts. */
export default function ProfessionalProfile() {
  const { user } = useAuth();
  return <OwnProfessionalProfile key={user?.id != null ? String(user.id) : 'signed-out'} />;
}

function SkeletonProfile() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-pulse" aria-busy="true" aria-label="Loading your profile">
      <div className="h-28 rounded-3xl bg-stone-100" />
      <div className="h-12 rounded-2xl bg-stone-100" />
      <div className="h-72 rounded-3xl bg-stone-100" />
    </div>
  );
}
