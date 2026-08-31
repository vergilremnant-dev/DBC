import SectionCard from './SectionCard';

interface SecurityValues {
  sessionTimeoutMinutes: string;
  accountLockThreshold: string;
  minPasswordLength: string;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  twoFactorEnabled: boolean;
}

interface SecuritySettingsProps {
  values: SecurityValues;
  onChange: (field: string, value: string | boolean) => void;
}

function ReadOnlyBadge() {
  return (
    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded ml-2">
      Read-only · Backend Required
    </span>
  );
}

function ToggleField({
  id, label, description, checked, readOnly, onChange,
}: {
  id: string; label: string; description?: string; checked: boolean; readOnly?: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-light-border/60 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-xs font-bold text-stone-700 block cursor-pointer">
          {label}
          {readOnly && <ReadOnlyBadge />}
        </label>
        {description && <p className="text-[10px] text-stone-500 font-medium mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={readOnly}
        onClick={() => !readOnly && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald
          ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${checked ? 'bg-brand-emerald border-brand-emerald' : 'bg-stone-200 border-stone-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-[1px] ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} aria-hidden="true" />
      </button>
    </div>
  );
}

const inputCls = "dbc-input text-xs w-24";

export default function SecuritySettings({ values, onChange }: SecuritySettingsProps) {
  return (
    <SectionCard title="Security Preferences" subtitle="Configure platform-wide security policies and session management." icon="🔒">
      <div className="space-y-0">
        {/* Password Policy */}
        <div className="py-4 border-b border-light-border/60">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Password Policy</p>
            <ReadOnlyBadge />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="sec-min-len" className="block text-[10px] font-bold text-stone-600 mb-1.5">Min. Password Length</label>
              <div className="flex items-center gap-2">
                <input
                  id="sec-min-len"
                  type="number"
                  value={values.minPasswordLength}
                  onChange={e => onChange('minPasswordLength', e.target.value)}
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                  min="6" max="32"
                  readOnly
                  aria-readonly="true"
                />
                <span className="text-[10px] text-stone-500">chars</span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {[
              { id: 'sec-uppercase', key: 'requireUppercase', label: 'Require uppercase letters' },
              { id: 'sec-numbers', key: 'requireNumbers', label: 'Require numbers' },
              { id: 'sec-special', key: 'requireSpecialChars', label: 'Require special characters' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-2.5 cursor-not-allowed opacity-60">
                <input
                  id={item.id}
                  type="checkbox"
                  checked={values[item.key as keyof SecurityValues] as boolean}
                  readOnly
                  disabled
                  className="w-3.5 h-3.5 accent-brand-emerald"
                />
                <span className="text-[10px] font-medium text-stone-600">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Session Timeout */}
        <div className="py-3.5 border-b border-light-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label htmlFor="sec-session" className="text-xs font-bold text-stone-700 block">
              Session Timeout <ReadOnlyBadge />
            </label>
            <p className="text-[10px] text-stone-500 font-medium mt-0.5">Auto-logout idle users after this period.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sec-session"
              type="number"
              value={values.sessionTimeoutMinutes}
              readOnly
              className={`${inputCls} opacity-60 cursor-not-allowed`}
              aria-readonly="true"
            />
            <span className="text-[10px] text-stone-500">minutes</span>
          </div>
        </div>

        {/* Account Lock */}
        <div className="py-3.5 border-b border-light-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label htmlFor="sec-lock" className="text-xs font-bold text-stone-700 block">
              Account Lock Threshold <ReadOnlyBadge />
            </label>
            <p className="text-[10px] text-stone-500 font-medium mt-0.5">Failed login attempts before temporary account lock.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sec-lock"
              type="number"
              value={values.accountLockThreshold}
              readOnly
              className={`${inputCls} opacity-60 cursor-not-allowed`}
              aria-readonly="true"
            />
            <span className="text-[10px] text-stone-500">attempts</span>
          </div>
        </div>

        {/* 2FA Toggle */}
        <ToggleField
          id="sec-2fa"
          label="Two-Factor Authentication"
          description="Require 2FA for all administrator accounts. (Phase 2)"
          checked={values.twoFactorEnabled}
          readOnly
          onChange={v => onChange('twoFactorEnabled', v)}
        />
      </div>
    </SectionCard>
  );
}
