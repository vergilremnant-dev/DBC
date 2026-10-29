import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAuthDispatch } from '../../hooks/auth/useAuthStore';
import { logoutThunk } from '../../store/auth/authSlice';
import { bookingApi } from '../../services/booking/bookingService';
import { RequirementService } from '../../services/customer/RequirementService';
import { ProjectService } from '../../services/contractor/ProjectService';
import { profileService, type ProfileCompletionResponse } from '../../services/profile/profileService';
import type { Project } from '../../types/contractor/ProjectTypes';
import { BRAND } from '../../config/branding';

/* ------------------------------------------------------------------ */
/* Icons — one consistent 24px stroke set for every row and shortcut. */
/* ------------------------------------------------------------------ */
const ICONS: Record<string, ReactNode> = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  pin: <><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
  shield: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4V3h6v1M9 11h6M9 15h4" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
};

function Icon({ name, className = 'h-5 w-5' }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Option list primitives                                              */
/* ------------------------------------------------------------------ */
interface OptionItem {
  label: string;
  description?: string;
  to: string;
  icon: keyof typeof ICONS;
  meta?: string;
}

const rowClass =
  'group flex w-full min-h-[56px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700';

function OptionRow({ item }: { item: OptionItem }) {
  return (
    <li>
      <Link to={item.to} className={rowClass}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-800">
          <Icon name={item.icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-stone-900 break-words">{item.label}</span>
          {item.description && <span className="block text-xs text-stone-600 break-words">{item.description}</span>}
        </span>
        {item.meta && <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{item.meta}</span>}
        <Icon name="chevron" className="h-4 w-4 shrink-0 text-stone-500 group-hover:text-stone-800" />
      </Link>
    </li>
  );
}

function OptionGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="px-1 text-xs font-bold uppercase tracking-wider text-stone-600">{title}</h2>
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">{children}</ul>
    </section>
  );
}

const formatStatus = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

/**
 * Customer profile hub — the entry point for every customer account option.
 * Shows only real account data (auth user, profile-completion API, the
 * customer's own requests/requirements/projects); nothing is simulated.
 */
export default function WorkspaceOverview() {
  const { user } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();

  const [completion, setCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [requirementCount, setRequirementCount] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectsError, setProjectsError] = useState(false);

  useEffect(() => {
    let alive = true;
    profileService.getCompletion().then((r) => alive && r?.success && typeof r.percentage === 'number' && setCompletion({ ...r, missingFields: r.missingFields ?? [] })).catch(() => {});
    bookingApi.getMyBookings().then((l) => alive && setRequestCount(Array.isArray(l) ? l.length : null)).catch(() => {});
    RequirementService.getMyRequirements().then((l) => alive && setRequirementCount(Array.isArray(l) ? l.length : null)).catch(() => {});
    ProjectService.listProjects()
      .then((l) => alive && setProjects(Array.isArray(l) ? l : []))
      .catch(() => alive && setProjectsError(true));
    return () => {
      alive = false;
    };
  }, []);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user?.email || 'Your account';
  const initials = (fullName || user?.email || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const pct = completion ? Math.max(0, Math.min(100, Math.round(completion.percentage))) : null;
  const complete = pct === 100;

  const handleSignOut = () => {
    dispatch(logoutThunk());
    navigate('/');
  };

  const count = (n: number | null) => (n === null ? undefined : String(n));

  const shortcuts: OptionItem[] = [
    { label: 'Project Requests', to: '/workspace/bookings', icon: 'clipboard', meta: count(requestCount) },
    { label: 'My Projects', to: '#my-projects', icon: 'building', meta: projects ? String(projects.length) : undefined },
    { label: 'Inbox', to: '/workspace/inbox', icon: 'chat' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Back to marketplace (desktop header already has a Marketplace link) */}
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center gap-1.5 lg:hidden rounded-lg pr-2 text-sm font-semibold text-stone-700 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
      >
        <Icon name="back" className="h-4 w-4" />
        Back to marketplace
      </Link>

      {/* Profile header */}
      <section aria-label="Profile summary" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-stone-900 break-words font-display">{displayName}</h1>
              <div className="mt-1 space-y-0.5 text-sm text-stone-600">
                {user?.phone && (
                  <p className="flex items-center gap-1.5 break-all"><Icon name="phone" className="h-3.5 w-3.5 shrink-0" />{user.phone}</p>
                )}
                {user?.email && fullName && (
                  <p className="flex items-center gap-1.5 break-all"><Icon name="mail" className="h-3.5 w-3.5 shrink-0" />{user.email}</p>
                )}
              </div>
            </div>
          </div>
          <Link to="/workspace/settings" className="dbc-btn dbc-btn-secondary dbc-btn-md min-h-[44px] w-full shrink-0 sm:w-auto">
            {pct !== null && !complete ? 'Complete profile' : 'Edit profile'}
          </Link>
        </div>

        {pct !== null && !complete && (
          <div className="mt-5 rounded-xl bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-stone-900">Profile {pct}% complete</span>
              {completion && completion.missingFields.length > 0 && (
                <span className="text-xs text-stone-600">{completion.missingFields.length} item{completion.missingFields.length === 1 ? '' : 's'} left</span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="Profile completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-stone-600">A complete profile helps professionals prepare accurate quotations.</p>
          </div>
        )}
      </section>

      {/* Shortcut cards — scroll horizontally on very narrow screens */}
      <nav aria-label="Shortcuts" className="-mx-1 overflow-x-auto no-scrollbar">
        <ul className="grid min-w-[288px] grid-cols-3 gap-3 px-1">
          {shortcuts.map((s) => {
            const inner = (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Icon name={s.icon} />
                </span>
                <span className="text-xs font-semibold leading-tight text-stone-900 sm:text-sm">{s.label}</span>
                {s.meta !== undefined && <span className="text-xs text-stone-600">{s.meta} total</span>}
              </>
            );
            const cls =
              'flex h-full min-h-[44px] flex-col items-center justify-start gap-2 rounded-2xl border border-stone-200 bg-white p-3 text-center shadow-xs transition hover:border-emerald-700/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-4';
            return (
              <li key={s.label}>
                {s.to.startsWith('#') ? (
                  <a href={s.to} className={cls}>{inner}</a>
                ) : (
                  <Link to={s.to} className={cls}>{inner}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* My projects — real projects from accepted quotations */}
      <section id="my-projects" aria-labelledby="hub-projects" className="scroll-mt-20 space-y-2">
        <h2 id="hub-projects" className="px-1 text-xs font-bold uppercase tracking-wider text-stone-600">My projects</h2>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          {projects === null && !projectsError && (
            <p className="px-4 py-5 text-sm text-stone-600" role="status">Loading your projects…</p>
          )}
          {projectsError && (
            <p className="px-4 py-5 text-sm text-stone-600" role="status">We couldn't load your projects right now. Please try again later.</p>
          )}
          {projects && projects.length === 0 && (
            <div className="space-y-3 px-4 py-5">
              <p className="text-sm text-stone-700">
                No projects yet. A project starts once you accept a professional's quotation; its documents, milestones and timeline will appear here.
              </p>
              <Link to="/workspace/requirements" className="dbc-btn dbc-btn-primary dbc-btn-md min-h-[44px]">Post a requirement</Link>
            </div>
          )}
          {projects && projects.length > 0 && (
            <ul className="divide-y divide-stone-100">
              {projects.map((p) => (
                <OptionRow
                  key={p.id}
                  item={{
                    label: p.requirement?.title || 'Project',
                    description: [p.provider?.businessName || p.provider?.fullName, 'Documents, milestones & timeline'].filter(Boolean).join(' · '),
                    to: `/projects/${p.id}`,
                    icon: 'building',
                    meta: formatStatus(p.status),
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <OptionGroup id="hub-workspace" title="Project workspace">
        <OptionRow item={{ label: 'My Requirements', description: 'Post and manage project requirements', to: '/workspace/requirements', icon: 'file', meta: count(requirementCount) }} />
        <OptionRow item={{ label: 'Project Requests', description: 'Track requests sent to professionals', to: '/workspace/bookings', icon: 'clipboard', meta: count(requestCount) }} />
        <OptionRow item={{ label: 'Appointments', description: 'Consultations and site visits', to: '/appointments', icon: 'calendar' }} />
        <OptionRow item={{ label: 'Inbox', description: 'Messages with professionals', to: '/workspace/inbox', icon: 'chat' }} />
        <OptionRow item={{ label: 'Notifications', to: '/workspace/notifications', icon: 'bell' }} />
      </OptionGroup>

      <OptionGroup id="hub-account" title="Profile & account">
        <OptionRow item={{ label: 'My Profile', description: 'Name, contact details and photo', to: '/workspace/settings', icon: 'user' }} />
        <OptionRow item={{ label: 'Saved Sites', description: 'Project locations and addresses', to: '/workspace/settings?tab=ADDRESSES', icon: 'pin' }} />
        <OptionRow item={{ label: 'Preferences', to: '/workspace/settings?tab=PREFERENCES', icon: 'sliders' }} />
        <OptionRow item={{ label: 'Security & Privacy', to: '/workspace/settings?tab=SECURITY', icon: 'shield' }} />
      </OptionGroup>

      <OptionGroup id="hub-help" title="Help & information">
        <OptionRow item={{ label: 'Help & Support', description: 'Request a callback from our team', to: '/request-callback', icon: 'phone' }} />
        <OptionRow item={{ label: `About ${BRAND.name}`, to: '/know-more', icon: 'info' }} />
      </OptionGroup>

      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-rose-700 shadow-xs transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 cursor-pointer"
      >
        <Icon name="logout" className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
