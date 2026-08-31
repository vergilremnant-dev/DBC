import SectionCard from './SectionCard';

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldRow({ label, htmlFor, hint, children }: FieldRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 items-start py-4 border-b border-light-border/60 last:border-b-0">
      <div className="sm:col-span-1">
        <label htmlFor={htmlFor} className="block text-xs font-bold text-stone-700 leading-snug cursor-pointer">
          {label}
        </label>
        {hint && <p className="text-[10px] text-stone-500 font-medium mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

interface GeneralSettingsProps {
  values: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    supportPhone: string;
    defaultTimezone: string;
    defaultLanguage: string;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: string;
  };
  onChange: (field: string, value: string) => void;
}

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London',
  'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'UTC',
];

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'];
const CURRENCIES = ['INR — Indian Rupee', 'USD — US Dollar', 'EUR — Euro', 'AED — UAE Dirham'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'];
const TIME_FORMATS = ['12-Hour (AM/PM)', '24-Hour'];

export default function GeneralSettingsForm({ values, onChange }: GeneralSettingsProps) {
  const inputCls = "dbc-input text-xs";
  const selectCls = "dbc-input bg-white text-xs cursor-pointer";

  return (
    <SectionCard title="General Settings" subtitle="Core platform identity and regional defaults." icon="🏢">
      <div>
        <FieldRow label="Platform Name" htmlFor="gs-name" hint="Displayed across the platform UI.">
          <input
            id="gs-name"
            type="text"
            value={values.platformName}
            onChange={e => onChange('platformName', e.target.value)}
            className={inputCls}
            placeholder="Design Build Connect"
            maxLength={80}
          />
        </FieldRow>

        <FieldRow label="Platform Description" htmlFor="gs-desc" hint="Short description shown on metadata and onboarding.">
          <textarea
            id="gs-desc"
            value={values.platformDescription}
            onChange={e => onChange('platformDescription', e.target.value)}
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="India's trusted marketplace for construction and design professionals."
            maxLength={300}
          />
          <p className="text-[9px] text-stone-400 font-medium mt-1">{values.platformDescription.length}/300 characters</p>
        </FieldRow>

        <FieldRow label="Support Email" htmlFor="gs-email" hint="Primary contact email for user support.">
          <input
            id="gs-email"
            type="email"
            value={values.supportEmail}
            onChange={e => onChange('supportEmail', e.target.value)}
            className={inputCls}
            placeholder="support@designbuildconnect.com"
          />
        </FieldRow>

        <FieldRow label="Support Phone" htmlFor="gs-phone" hint="Support phone number displayed in the help center.">
          <input
            id="gs-phone"
            type="tel"
            value={values.supportPhone}
            onChange={e => onChange('supportPhone', e.target.value)}
            className={inputCls}
            placeholder="+91 99999 00000"
          />
        </FieldRow>

        <FieldRow label="Default Time Zone" htmlFor="gs-tz">
          <select id="gs-tz" value={values.defaultTimezone} onChange={e => onChange('defaultTimezone', e.target.value)} className={selectCls}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Default Language" htmlFor="gs-lang">
          <select id="gs-lang" value={values.defaultLanguage} onChange={e => onChange('defaultLanguage', e.target.value)} className={selectCls}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Default Currency" htmlFor="gs-currency">
          <select id="gs-currency" value={values.defaultCurrency} onChange={e => onChange('defaultCurrency', e.target.value)} className={selectCls}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Date Format" htmlFor="gs-date">
          <select id="gs-date" value={values.dateFormat} onChange={e => onChange('dateFormat', e.target.value)} className={selectCls}>
            {DATE_FORMATS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Time Format" htmlFor="gs-time">
          <div className="flex gap-3">
            {TIME_FORMATS.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="timeFormat"
                  value={f}
                  checked={values.timeFormat === f}
                  onChange={() => onChange('timeFormat', f)}
                  className="w-3.5 h-3.5 accent-brand-emerald"
                />
                <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900 transition">{f}</span>
              </label>
            ))}
          </div>
        </FieldRow>
      </div>
    </SectionCard>
  );
}
