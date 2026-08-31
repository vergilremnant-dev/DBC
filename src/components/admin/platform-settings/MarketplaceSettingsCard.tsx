import SectionCard from './SectionCard';

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-light-border/60 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-xs font-bold text-stone-700 cursor-pointer block">{label}</label>
        <p className="text-[10px] text-stone-500 font-medium mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald cursor-pointer
          ${checked ? 'bg-brand-emerald border-brand-emerald' : 'bg-stone-200 border-stone-200'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-[1px]
            ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

interface SelectRowProps {
  id: string;
  label: string;
  description: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

function SelectRow({ id, label, description, value, options, onChange }: SelectRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 border-b border-light-border/60 last:border-b-0">
      <div className="min-w-0 sm:flex-1">
        <label htmlFor={id} className="text-xs font-bold text-stone-700 cursor-pointer block">{label}</label>
        <p className="text-[10px] text-stone-500 font-medium mt-0.5">{description}</p>
      </div>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="dbc-input bg-white text-xs cursor-pointer sm:w-56 shrink-0"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface MarketplaceSettingsProps {
  values: {
    marketplaceStatus: string;
    defaultRequirementVisibility: string;
    defaultProjectStatus: string;
    registrationApprovalMode: string;
    publicProfileVisibility: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
}

export default function MarketplaceSettingsCard({ values, onChange }: MarketplaceSettingsProps) {
  return (
    <SectionCard title="Marketplace Configuration" subtitle="Control marketplace behavior and default settings." icon="🛍️">
      <div>
        <SelectRow
          id="mc-status"
          label="Marketplace Status"
          description="Enable or restrict the public marketplace listing."
          value={values.marketplaceStatus}
          options={['Active', 'Maintenance Mode', 'Read-Only', 'Disabled']}
          onChange={v => onChange('marketplaceStatus', v)}
        />
        <SelectRow
          id="mc-req-visibility"
          label="Default Requirement Visibility"
          description="New requirements are visible to this audience by default."
          value={values.defaultRequirementVisibility}
          options={['Public', 'Verified Partners Only', 'Private']}
          onChange={v => onChange('defaultRequirementVisibility', v)}
        />
        <SelectRow
          id="mc-proj-status"
          label="Default Project Status"
          description="Status assigned to newly created projects."
          value={values.defaultProjectStatus}
          options={['Planning', 'Awaiting Assignment', 'Draft']}
          onChange={v => onChange('defaultProjectStatus', v)}
        />
        <SelectRow
          id="mc-approval"
          label="Registration Approval Mode"
          description="Whether new registrations require manual review."
          value={values.registrationApprovalMode}
          options={['Automatic', 'Manual Review', 'Invite Only']}
          onChange={v => onChange('registrationApprovalMode', v)}
        />
        <ToggleRow
          id="mc-profile-visibility"
          label="Public Profile Visibility"
          description="Allow provider profiles to be visible to non-authenticated visitors."
          checked={values.publicProfileVisibility}
          onChange={v => onChange('publicProfileVisibility', v)}
        />
      </div>
    </SectionCard>
  );
}
