import SectionCard from './SectionCard';

interface BrandingValues {
  platformName: string;
  footerText: string;
  copyrightText: string;
  primaryContact: string;
  primaryEmail: string;
}

interface BrandingPanelProps {
  values: BrandingValues;
  onChange: (field: string, value: string) => void;
}

function UploadPlaceholder({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">{label}</p>
      <div
        className="border-2 border-dashed border-light-border rounded-2xl p-6 text-center bg-stone-50 hover:bg-stone-100 transition cursor-pointer focus-within:ring-2 focus-within:ring-brand-emerald"
        role="region"
        aria-label={`${label} upload area`}
      >
        <span className="text-2xl block mb-2" aria-hidden="true">🖼️</span>
        <p className="text-xs font-bold text-stone-600">Drag & drop or click to upload</p>
        <p className="text-[10px] text-stone-400 font-medium mt-1">{hint}</p>
        <button
          type="button"
          className="mt-3 dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-light-border text-stone-600"
          aria-label={`Choose file for ${label}`}
        >
          Choose File
        </button>
        <p className="text-[9px] text-amber-600 font-bold mt-2 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
          ⚠️ File upload requires backend storage integration (Phase 2)
        </p>
      </div>
    </div>
  );
}

const inputCls = "dbc-input text-xs";

export default function BrandingPanel({ values, onChange }: BrandingPanelProps) {
  return (
    <SectionCard title="Platform Branding" subtitle="Manage visual identity, contact details, and footer content." icon="🎨">
      <div className="space-y-6">
        {/* Image Uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UploadPlaceholder label="Platform Logo" hint="PNG or SVG · Max 500KB · Recommended 200×60px" />
          <UploadPlaceholder label="Favicon" hint="ICO or PNG · 32×32px or 64×64px" />
        </div>

        <div className="border-t border-light-border/60 pt-5 space-y-4">
          <div>
            <label htmlFor="brand-name" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Platform Display Name</label>
            <input
              id="brand-name"
              type="text"
              value={values.platformName}
              onChange={e => onChange('platformName', e.target.value)}
              className={inputCls}
              placeholder="Design Build Connect"
              maxLength={80}
            />
          </div>

          <div>
            <label htmlFor="brand-footer" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Footer Text</label>
            <textarea
              id="brand-footer"
              value={values.footerText}
              onChange={e => onChange('footerText', e.target.value)}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="India's trusted platform for construction and design coordination."
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="brand-copyright" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Copyright Text</label>
            <input
              id="brand-copyright"
              type="text"
              value={values.copyrightText}
              onChange={e => onChange('copyrightText', e.target.value)}
              className={inputCls}
              placeholder="© 2026 Design Build Connect. All rights reserved."
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand-contact" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Primary Contact Name</label>
              <input
                id="brand-contact"
                type="text"
                value={values.primaryContact}
                onChange={e => onChange('primaryContact', e.target.value)}
                className={inputCls}
                placeholder="DBC Support Team"
              />
            </div>
            <div>
              <label htmlFor="brand-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Primary Contact Email</label>
              <input
                id="brand-email"
                type="email"
                value={values.primaryEmail}
                onChange={e => onChange('primaryEmail', e.target.value)}
                className={inputCls}
                placeholder="hello@designbuildconnect.com"
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
