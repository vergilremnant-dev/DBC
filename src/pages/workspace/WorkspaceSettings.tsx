import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAuthDispatch } from '../../hooks/auth/useAuthStore';
import { logoutThunk } from '../../store/auth/authSlice';
import { BRAND } from '../../config/branding';
import { axiosClient } from '../../services/auth/axiosClient';
import { authService } from '../../services/auth/authService';
import { profileService } from '../../services/profile/profileService';
import { useOwnProfile, profileSaveErrors } from '../../hooks/profile/useOwnProfile';
import { readScoped, writeScoped } from '../../utils/accountStorage';
import { ProfileHeader } from '../../components/workspace/settings/ProfileHeader';
import { ProfileCompletionCard } from '../../components/workspace/settings/ProfileCompletionCard';
import { CustomerProfileForm, type CustomerProfileValues } from '../../components/workspace/settings/CustomerProfileForm';
import { AddressCard } from '../../components/workspace/settings/AddressCard';
import type { UserAddress } from '../../components/workspace/settings/AddressCard';
import { PreferenceCard } from '../../components/workspace/settings/PreferenceCard';
import type { UserPreferences } from '../../components/workspace/settings/PreferenceCard';
import { SecurityCard, type SessionSummary } from '../../components/workspace/settings/SecurityCard';
import { AccountInfoCard } from '../../components/workspace/settings/AccountInfoCard';

/** Customer profile as returned by GET /api/profile for the signed-in customer. */
interface CustomerProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
  city: string;
  state: string;
  pincode: string;
  profileImageUrl: string | null;
  createdAt: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'Light',
  language: 'English',
  timeZone: 'IST',
  dateFormat: 'DD/MM/YYYY',
  notifyOnBids: true,
  notifyOnBookings: true,
  notifyOnMessages: true,
  notifyOnPromotions: false,
  marketingEmails: true,
};

const MISSING_LABELS: Record<string, string> = {
  fullName: 'Add your full name',
  phoneNumber: 'Add your phone number',
  city: 'Add your city',
  state: 'Add your state',
  pincode: 'Add your PIN code',
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_INPUT_ID = 'settings-avatar-input';

const memberSince = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—');
/** Short, stable account reference shown to the customer (derived from their own profile id). */
const accountReference = (id?: string) => (id ? `DBC-C-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}` : '—');

function browserLabel(ua?: string | null) {
  if (!ua) return 'Signed-in device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

/** Downscale an avatar to a small JPEG so it stays light wherever it is shown. */
async function avatarDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = original;
    });
    const scale = Math.min(1, 320 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return original;
  }
}

/**
 * Customer settings. Remounted per account (see the default export), and every identity field comes from the
 * signed-in account's own profile API; nothing is read from shared browser storage.
 */
function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAuthDispatch();
  const own = useOwnProfile<CustomerProfileRecord>();
  const profile = own.status === 'ready' ? own.profile : null;
  const userId = own.userId;

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ADDRESSES' | 'PREFERENCES' | 'SECURITY' | 'SYSTEM'>(() => {
    const requested = searchParams.get('tab');
    return requested === 'ADDRESSES' || requested === 'PREFERENCES' || requested === 'SECURITY' ? requested : 'PROFILE';
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<{ fields: Record<string, string>; message: string }>({ fields: {}, message: '' });
  const [notice, setNotice] = useState('');

  // Saved sites and preferences have no server storage yet: they are kept on this device, under this account only,
  // and are cleared at sign-out.
  const [addresses, setAddresses] = useState<UserAddress[]>(() => readScoped<UserAddress[]>(userId, 'addresses', []));
  const [preferences, setPreferences] = useState<UserPreferences>(() => readScoped(userId, 'preferences', DEFAULT_PREFERENCES));
  useEffect(() => writeScoped(userId, 'addresses', addresses), [userId, addresses]);
  useEffect(() => writeScoped(userId, 'preferences', preferences), [userId, preferences]);

  // The account's real sign-in sessions.
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsVersion, setSessionsVersion] = useState(0);
  useEffect(() => {
    if (activeTab !== 'SECURITY') return;
    let alive = true;
    authService
      .getSessions()
      .then((r) => {
        if (!alive) return;
        const rows = (r?.data ?? []) as { id: string; userAgent?: string | null; ipAddress?: string | null; createdAt?: string }[];
        setSessions(rows.map((s) => ({ id: s.id, browser: browserLabel(s.userAgent), ip: s.ipAddress ? String(s.ipAddress).split(',')[0].trim() : '', location: s.createdAt ? `Signed in ${new Date(s.createdAt).toLocaleDateString('en-IN')}` : '', current: false })));
      })
      .catch(() => alive && setSessions([]));
    return () => {
      alive = false;
    };
  }, [activeTab, sessionsVersion]);

  const formValues: CustomerProfileValues = {
    fullName: profile?.fullName ?? '',
    phoneNumber: profile?.phoneNumber ?? user?.phone ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    pincode: profile?.pincode ?? '',
  };

  const saveProfile = async (values: CustomerProfileValues, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    setSaveErrors({ fields: {}, message: '' });
    try {
      await own.save({ ...values, profileImageUrl: profile?.profileImageUrl ?? undefined, ...extra });
      setIsEditing(false);
      setNotice('Profile saved.');
      return true;
    } catch (err) {
      setSaveErrors(profileSaveErrors(err));
      setIsEditing(true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFile = async (file?: File) => {
    if (!file) return;
    setNotice('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > MAX_AVATAR_BYTES) {
      setNotice('Choose a JPEG, PNG or WEBP image up to 2 MB.');
      return;
    }
    try {
      const uploaded = await profileService.uploadImage(await avatarDataUrl(file), 'avatars');
      if (!uploaded?.url) throw new Error('upload');
      await saveProfile(formValues, { profileImageUrl: uploaded.url });
    } catch {
      setNotice('Could not update your photo. Please try again.');
    }
  };

  const openEditor = () => { setActiveTab('PROFILE'); setIsEditing(true); };
  const openAvatarPicker = () => document.getElementById(AVATAR_INPUT_ID)?.click();
  // Same server completion as the My Account page, plus the optional items it does not list.
  const completionTasks = (own.completion?.missingFields ?? []).map((f) => ({ id: f, label: MISSING_LABELS[f] ?? 'Complete your profile', action: openEditor }));
  if (profile && !profile.profileImageUrl) completionTasks.push({ id: 'photo', label: 'Add a profile photo', action: openAvatarPicker });
  if (profile && !profile.address) completionTasks.push({ id: 'address', label: 'Add your address', action: openEditor });

  const handleChangePassword = async (oldPw: string, newPw: string): Promise<boolean> => {
    try {
      await axiosClient.post('/api/auth/change-password', { currentPassword: oldPw, newPassword: newPw });
      return true;
    } catch {
      return false;
    }
  };

  const handleExportData = () => {
    if (!profile) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ profile: { ...formValues, email: user?.email }, savedSites: addresses, preferences }, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `${BRAND.name.toLowerCase()}_profile_export.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteAccount = () => {
    alert(`To delete your account, please contact ${BRAND.name} support from your registered phone number or email.`);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      void dispatch(logoutThunk());
      navigate('/');
    }
  };

  const handleAddAddress = (newAddr: Omit<UserAddress, 'id'>) => {
    const address: UserAddress = { ...newAddr, id: `addr-${Date.now()}` };
    setAddresses((prev) => (address.isDefault ? prev.map((a) => ({ ...a, isDefault: false })).concat(address) : [...prev, address]));
  };
  const handleEditAddress = (id: string, fields: Partial<UserAddress>) => {
    setAddresses((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...fields } : a));
      return fields.isDefault ? next.map((a) => (a.id === id ? a : { ...a, isDefault: false })) : next;
    });
  };
  const handleDeleteAddress = (id: string) => {
    if (!window.confirm('Delete this saved site?')) return;
    setAddresses((prev) => {
      const wasDefault = prev.find((a) => a.id === id)?.isDefault;
      const remaining = prev.filter((a) => a.id !== id);
      return wasDefault && remaining.length > 0 ? remaining.map((a, i) => ({ ...a, isDefault: i === 0 })) : remaining;
    });
  };
  const handleSetDefaultAddress = (id: string) => setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  const tabs = [
    { id: 'PROFILE', label: '👤 Profile Info' },
    { id: 'ADDRESSES', label: '📍 Saved Sites' },
    { id: 'PREFERENCES', label: '⚙️ Preferences' },
    { id: 'SECURITY', label: '🔒 Security & Privacy' },
    { id: 'SYSTEM', label: '📊 System Info' },
  ] as const;

  // Loading / error / missing: show nothing that could belong to another account.
  if (own.status === 'loading') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto" aria-busy="true" aria-label="Loading your settings">
        <div className="h-32 animate-pulse rounded-3xl bg-stone-100" />
        <div className="h-10 animate-pulse rounded-xl bg-stone-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-stone-100" />
      </div>
    );
  }
  if (own.status === 'error') {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl border border-stone-200 bg-white p-6 text-center" role="alert">
        <p className="text-sm text-stone-700">{own.error}</p>
        <button type="button" onClick={own.reload} className="dbc-btn dbc-btn-md dbc-btn-secondary mt-3">Try again</button>
      </div>
    );
  }

  const fullName = profile?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Your account';

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative">
      <ProfileHeader
        avatarUrl={profile?.profileImageUrl || undefined}
        fullName={fullName}
        customerId={accountReference(profile?.id)}
        memberSince={memberSince(profile?.createdAt)}
        status={user?.status && user.status !== 'ACTIVE' ? user.status : 'Active account'}
        isEditing={isEditing}
        onToggleEdit={() => { setSaveErrors({ fields: {}, message: '' }); setActiveTab('PROFILE'); setIsEditing(!isEditing); }}
        onAvatarChange={profile ? openAvatarPicker : undefined}
      />
      <input
        id={AVATAR_INPUT_ID}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => { void onAvatarFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      {notice && <p className="rounded-xl border border-stone-200 bg-white p-3 text-xs font-semibold text-stone-700" role="status">{notice}</p>}

      <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-xs no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-stone-600 hover:text-stone-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      <div className="space-y-6">
        {activeTab === 'PROFILE' && (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="space-y-6 lg:col-span-8">
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                {isEditing || own.status === 'missing' ? (
                  <CustomerProfileForm
                    initialValues={formValues}
                    saving={saving}
                    serverErrors={saveErrors.fields}
                    serverMessage={saveErrors.message}
                    onSubmit={(v) => void saveProfile(v)}
                    onCancel={own.status === 'missing' ? undefined : () => setIsEditing(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-display border-b border-stone-100 pb-2">Personal Details</h3>
                    <dl className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-stone-600">
                      {[
                        ['Full name', profile?.fullName],
                        ['Phone number', profile?.phoneNumber || user?.phone],
                        ['Email', user?.email],
                        ['Address', profile?.address],
                        ['City', profile?.city],
                        ['State', profile?.state],
                        ['PIN code', profile?.pincode],
                      ].map(([label, value]) => (
                        <div key={label} className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                          <dt className="block text-3xs uppercase font-bold text-stone-500">{label}</dt>
                          <dd className="text-stone-900 [overflow-wrap:anywhere]">{value || 'Not added yet'}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-4 h-full">
              <ProfileCompletionCard percentage={own.completion ? Math.max(0, Math.min(100, Math.round(own.completion.percentage))) : 0} incompleteItems={completionTasks} />
            </div>
          </div>
        )}

        {activeTab === 'ADDRESSES' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-600">Saved sites are kept on this device for your account and are removed when you sign out.</p>
            <AddressCard
              addresses={addresses}
              onAddAddress={handleAddAddress}
              onEditAddress={handleEditAddress}
              onDeleteAddress={handleDeleteAddress}
              onSetDefaultAddress={handleSetDefaultAddress}
            />
          </div>
        )}

        {activeTab === 'PREFERENCES' && <PreferenceCard initialValues={preferences} onSave={setPreferences} />}

        {activeTab === 'SECURITY' && (
          <SecurityCard
            onChangePassword={handleChangePassword}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
            sessions={sessions}
            onRevokeSession={(id) => {
              authService.revokeSession(id).then(() => setSessionsVersion((n) => n + 1)).catch(() => setNotice('Could not sign out that session.'));
            }}
          />
        )}

        {activeTab === 'SYSTEM' && (
          <div className="space-y-4">
            <AccountInfoCard
              accountType="Customer account"
              role={user?.role ?? 'ROLE_CUSTOMER'}
              memberSince={memberSince(profile?.createdAt)}
              lastLogin="Current session"
              status={user?.status ?? 'ACTIVE'}
            />
            <div className="flex justify-end pt-2">
              <button onClick={handleLogoutClick} className="dbc-btn dbc-btn-md dbc-btn-danger">
                Log Out Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** One settings instance per authenticated account: switching accounts never reuses the previous account's state. */
export default function WorkspaceSettings() {
  const { user } = useAuth();
  return <AccountSettings key={user?.id != null ? String(user.id) : 'signed-out'} />;
}
