import { useState } from 'react';
import type { FormEvent } from 'react';

/** Typed payload emitted when registration is complete. */
export interface RegisterPayload {
  role: 'ROLE_CUSTOMER' | 'ROLE_PROVIDER';
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

interface RegisterWizardProps {
  onRegisterComplete: (payload: RegisterPayload) => void;
  onBackToLogin: () => void;
}

export function RegisterWizard({ onRegisterComplete, onBackToLogin }: RegisterWizardProps) {
  const [fullName, setFullName] = useState('');
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (channel === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Success - trigger completion
    const [first, ...rest] = fullName.trim().split(' ');
    const finalPayload: RegisterPayload = {
      role: 'ROLE_CUSTOMER',
      firstName: first || '',
      lastName: rest.join(' '),
      email: channel === 'email' ? email : `${phone}@dbc.com`, // dummy email fallback if registered with phone
      phoneNumber: channel === 'phone' ? phone : undefined,
    };

    onRegisterComplete(finalPayload);
    setSuccess(true);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <h3 className="text-xl font-bold font-serif text-stone-900">Create Your Account</h3>
        <p className="text-xs text-stone-500">Sign up as a customer to get started with your projects.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Full Name */}
          <div>
            <label htmlFor="reg-fullname" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
              Full Name
            </label>
            <input
              id="reg-fullname"
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 placeholder:text-stone-400"
            />
          </div>

          {/* Toggle Choice */}
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
              Registration Channel
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setChannel('email');
                  setError(null);
                }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                  channel === 'email'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Email Address
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannel('phone');
                  setError(null);
                }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                  channel === 'phone'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Phone Number
              </button>
            </div>
          </div>

          {/* Email Input */}
          {channel === 'email' && (
            <div>
              <label htmlFor="reg-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 placeholder:text-stone-400"
              />
            </div>
          )}

          {/* Phone Input */}
          {channel === 'phone' && (
            <div>
              <label htmlFor="reg-phone" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                Phone Number
              </label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                required
                className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 placeholder:text-stone-400"
              />
            </div>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-password" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 placeholder:text-stone-400"
              />
            </div>
            <div>
              <label htmlFor="reg-confirm-password" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                Confirm Password
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed" role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            Register
          </button>
        </form>
      ) : (
        <div className="space-y-3 py-6 text-center">
          <div className="flex justify-center">
            <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-lg">
              ✓
            </span>
          </div>
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Registration Successful</h4>
          <p className="text-xs text-stone-600 leading-relaxed max-w-[280px] mx-auto">
            {channel === 'email' ? (
              <>We have dispatched a validation link to <strong className="text-stone-900">{email}</strong>. Check your inbox to secure your workspace setup.</>
            ) : (
              <>We have dispatched a verification code SMS to <strong className="text-stone-900">{phone}</strong>. Verify it to activate your workspace setup.</>
            )}
          </p>
        </div>
      )}

      {/* Switch back link */}
      <div className="pt-2 text-center border-t border-stone-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-bold text-stone-500 hover:text-stone-900 transition cursor-pointer"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
