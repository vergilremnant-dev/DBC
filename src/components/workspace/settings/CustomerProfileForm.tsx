import { useState } from 'react';

/** The customer profile fields stored by the DBC API (POST /api/profile). */
export interface CustomerProfileValues {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface CustomerProfileFormProps {
  initialValues: CustomerProfileValues;
  onSubmit: (values: CustomerProfileValues) => void;
  onCancel?: () => void;
  saving?: boolean;
  /** Field errors returned by the API. */
  serverErrors?: Record<string, string>;
  serverMessage?: string;
}

function validate(v: CustomerProfileValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.fullName.trim()) e.fullName = 'Full name is required';
  if (!v.city.trim()) e.city = 'City is required';
  if (!v.state.trim()) e.state = 'State is required';
  if (!/^\d{5,6}$/.test(v.pincode.trim())) e.pincode = 'Enter a valid PIN code';
  return e;
}

export function CustomerProfileForm({ initialValues, onSubmit, onCancel, saving, serverErrors = {}, serverMessage }: CustomerProfileFormProps) {
  const [values, setValues] = useState<CustomerProfileValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof CustomerProfileValues) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const err = (k: keyof CustomerProfileValues) => errors[k] || serverErrors[k];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ ...values, fullName: values.fullName.trim(), city: values.city.trim(), state: values.state.trim(), pincode: values.pincode.trim(), address: values.address.trim() });
  };

  const field = (k: keyof CustomerProfileValues, label: string, opts: { readOnly?: boolean; hint?: string; inputMode?: 'numeric'; autoComplete?: string; span?: boolean } = {}) => (
    <label className={`block space-y-1 ${opts.span ? 'sm:col-span-2' : ''}`}>
      <span className="text-2xs font-bold uppercase text-stone-600">{label}</span>
      <input
        name={k}
        value={values[k]}
        onChange={set(k)}
        readOnly={opts.readOnly}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete}
        aria-invalid={!!err(k)}
        className={`dbc-input w-full ${opts.readOnly ? 'bg-stone-50 text-stone-600' : ''}`}
      />
      {opts.hint && <span className="block text-2xs text-stone-500">{opts.hint}</span>}
      {err(k) && <span className="block text-2xs font-semibold text-rose-700" role="alert">{err(k)}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h3 className="text-sm font-bold text-stone-900 font-display border-b border-stone-100 pb-2">Edit personal details</h3>
      {serverMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{serverMessage}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('fullName', 'Full name', { autoComplete: 'name', span: true })}
        {field('phoneNumber', 'Phone number', { readOnly: true, hint: 'Your sign-in number. Contact DBC support to change it.' })}
        {field('pincode', 'PIN code', { inputMode: 'numeric', autoComplete: 'postal-code' })}
        {field('address', 'Address (optional)', { autoComplete: 'street-address', span: true })}
        {field('city', 'City', { autoComplete: 'address-level2' })}
        {field('state', 'State', { autoComplete: 'address-level1' })}
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="dbc-btn dbc-btn-md dbc-btn-secondary" disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
