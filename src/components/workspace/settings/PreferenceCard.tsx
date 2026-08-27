import { useState } from 'react';

export interface UserPreferences {
  theme: 'Light' | 'Dark' | 'System';
  language: string;
  timeZone: string;
  dateFormat: string;
  notifyOnBids: boolean;
  notifyOnBookings: boolean;
  notifyOnMessages: boolean;
  notifyOnPromotions: boolean;
  marketingEmails: boolean;
}

interface PreferenceCardProps {
  initialValues: UserPreferences;
  onSave: (values: UserPreferences) => void;
  saving?: boolean;
}

export function PreferenceCard({ initialValues, onSave, saving = false }: PreferenceCardProps) {
  const [values, setValues] = useState<UserPreferences>(initialValues);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setValues((prev) => ({ ...prev, [name]: checked }));
    } else {
      setValues((prev) => ({ ...prev, [name]: value }));
    }
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5 text-left text-xs font-semibold text-stone-700">
      <div className="border-b border-stone-100 pb-2 flex justify-between items-center">
        <h3 className="text-sm font-bold text-stone-900 font-serif">System Preferences</h3>
        {success && (
          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
            Preferences Saved!
          </span>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-stone-400">Theme (UI Mode)</label>
          <select
            name="theme"
            value={values.theme}
            onChange={handleChange}
            className="mt-1 dbc-input bg-white"
          >
            <option value="Light">Light Slate Mode</option>
            <option value="Dark">Premium Dark Mode (Coming Soon)</option>
            <option value="System">Sync with Browser Defaults</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-stone-400">Language</label>
          <select
            name="language"
            value={values.language}
            onChange={handleChange}
            className="mt-1 dbc-input bg-white"
          >
            <option value="English">English (IN)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-stone-400">Time Zone</label>
          <select
            name="timeZone"
            value={values.timeZone}
            onChange={handleChange}
            className="mt-1 dbc-input bg-white"
          >
            <option value="IST">Kolkata, India (IST - UTC+5:30)</option>
            <option value="GMT">Greenwich Mean Time (GMT - UTC+0:00)</option>
            <option value="PST">Pacific Standard Time (PST - UTC-8:00)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-stone-400">Date Format</label>
          <select
            name="dateFormat"
            value={values.dateFormat}
            onChange={handleChange}
            className="mt-1 dbc-input bg-white"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 30/07/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/30/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-30)</option>
          </select>
        </div>
      </div>

      {/* Notifications Checklist */}
      <div className="space-y-3 pt-3 border-t border-stone-50">
        <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
          Notification Preferences
        </span>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-2.5 p-2 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-stone-50 cursor-pointer select-none">
            <input
              type="checkbox"
              name="notifyOnBids"
              checked={values.notifyOnBids}
              onChange={handleChange}
              className="dbc-checkbox mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-stone-900">Bid Alerts</span>
              <p className="text-[10px] text-stone-400 font-medium leading-none">Notify me when contractors place bids on my requirements.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-stone-50 cursor-pointer select-none">
            <input
              type="checkbox"
              name="notifyOnBookings"
              checked={values.notifyOnBookings}
              onChange={handleChange}
              className="dbc-checkbox mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-stone-900">Booking Confirmations</span>
              <p className="text-[10px] text-stone-400 font-medium leading-none">Notify when schedules are accepted or status changes.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-stone-50 cursor-pointer select-none">
            <input
              type="checkbox"
              name="notifyOnMessages"
              checked={values.notifyOnMessages}
              onChange={handleChange}
              className="dbc-checkbox mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-stone-900">Messages & Replies</span>
              <p className="text-[10px] text-stone-400 font-medium leading-none">Notify me when design consultants reply in inbox.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-stone-50 cursor-pointer select-none">
            <input
              type="checkbox"
              name="notifyOnPromotions"
              checked={values.notifyOnPromotions}
              onChange={handleChange}
              className="dbc-checkbox mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-stone-900">Promotion Alerts</span>
              <p className="text-[10px] text-stone-400 font-medium leading-none">Monsoon special discounts and Vastu pass alerts.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Marketing Checklist */}
      <div className="pt-3 border-t border-stone-50 flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="marketingEmails"
            checked={values.marketingEmails}
            onChange={handleChange}
            className="dbc-checkbox"
          />
          <span className="text-[10px] uppercase font-bold text-stone-400">Subscribe to monthly construction guides</span>
        </label>
        
        <button
          type="submit"
          disabled={saving}
          className="dbc-btn dbc-btn-md dbc-btn-primary"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
