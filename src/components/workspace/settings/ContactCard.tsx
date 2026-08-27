import { useState } from 'react';

export interface ContactInfoData {
  email: string;
  phone: string;
  altPhone: string;
  preferredMethod: 'WhatsApp' | 'Call' | 'Email';
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface ContactCardProps {
  initialValues: ContactInfoData;
  onSubmit: (values: ContactInfoData) => void;
  saving?: boolean;
}

export function ContactCard({ initialValues, onSubmit, saving = false }: ContactCardProps) {
  const [values, setValues] = useState<ContactInfoData>(initialValues);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Phone validation regex check
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(values.phone)) {
      setError('Please enter a valid 10-digit primary phone number.');
      return;
    }
    if (values.altPhone && !phoneRegex.test(values.altPhone)) {
      setError('Please enter a valid 10-digit alternate phone number.');
      return;
    }

    onSubmit(values);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
        <h3 className="text-sm font-bold text-stone-900 font-serif">Contact Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
        >
          {isEditing ? 'Cancel' : 'Edit Contact'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-bold p-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-stone-700">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-stone-400">Email Address (Read-only)</label>
            <input
              type="email"
              value={values.email}
              disabled
              className="mt-1 dbc-input bg-stone-50 text-stone-400 cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                required
                className="mt-1 dbc-input"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Alternate Phone</label>
              <input
                type="tel"
                name="altPhone"
                value={values.altPhone}
                onChange={handleChange}
                placeholder="e.g. 9876543211"
                className="mt-1 dbc-input"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-stone-400">Preferred Contact Method</label>
            <select
              name="preferredMethod"
              value={values.preferredMethod}
              onChange={handleChange}
              className="mt-1 dbc-input bg-white"
            >
              <option value="WhatsApp">WhatsApp Message</option>
              <option value="Call">Direct Phone Call</option>
              <option value="Email">Email Correspondence</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Update Contact Info
          </button>
        </form>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-stone-600">
          <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Primary Email</span>
              <span className="text-stone-955 truncate block max-w-xs">{values.email}</span>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
              values.emailVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              {values.emailVerified ? 'Verified ✓' : 'Pending'}
            </span>
          </div>

          <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Primary Phone</span>
              <span className="text-stone-955 font-mono block">{values.phone || 'Not Added'}</span>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
              values.phoneVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              {values.phoneVerified ? 'Verified ✓' : 'Verify Call'}
            </span>
          </div>

          <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
            <span className="block text-[9px] uppercase font-bold text-stone-400">Alternate Phone</span>
            <span className="text-stone-955 font-mono block">{values.altPhone || 'None Provided'}</span>
          </div>

          <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
            <span className="block text-[9px] uppercase font-bold text-stone-400">Preferred Contact Channel</span>
            <span className="text-stone-955 block">{values.preferredMethod}</span>
          </div>
        </div>
      )}
    </div>
  );
}
