import { useState, useEffect } from 'react';
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

// Privacy masking utility functions
function maskEmail(emailStr: string): string {
  const [user, domain] = emailStr.split('@');
  if (!user || !domain) return emailStr;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  const visible = user.slice(0, 2);
  const masked = '*'.repeat(user.length - 2);
  return `${visible}${masked}@${domain}`;
}

function maskPhone(phoneStr: string): string {
  if (phoneStr.length <= 4) return phoneStr;
  const visible = phoneStr.slice(-4);
  const masked = '*'.repeat(phoneStr.length - 4);
  return `${masked}${visible}`;
}

export function RegisterWizard({ onRegisterComplete, onBackToLogin }: RegisterWizardProps) {
  // Navigation step state (1 = Register Form, 2 = Verify Screen, 3 = Success)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Countdown timer effect for resend cooldown
  useEffect(() => {
    if (step === 2 && resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendCooldown]);

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation checks
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

    // Pass verification check step transition
    setStep(2);
    setResendCooldown(30); // reset timer
  };

  const handleVerifySubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    // Call layout integration hook (Frontend mock payload)
    const [first, ...rest] = fullName.trim().split(' ');
    const finalPayload: RegisterPayload = {
      role: 'ROLE_CUSTOMER',
      firstName: first || '',
      lastName: rest.join(' '),
      email: channel === 'email' ? email : `${phone}@dbc.com`,
      phoneNumber: channel === 'phone' ? phone : undefined,
    };

    onRegisterComplete(finalPayload);
    setStep(3); // success view
  };

  const handleResendClick = () => {
    if (resendCooldown === 0) {
      setResendCooldown(30);
      alert('A new verification code has been dispatched (frontend simulation).');
    }
  };

  return (
    <div className="space-y-4 text-left">
      
      {/* STEP 1: Registration form */}
      {step === 1 && (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-stone-900 font-serif">Create Your Account</h2>
            <p className="text-xs text-stone-500">Sign up as a customer to get started with your projects.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-2">
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
                className="dbc-input text-xs placeholder:text-stone-400"
              />
            </div>

            {/* Choice */}
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

            {/* Email Field */}
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
                  className="dbc-input text-xs placeholder:text-stone-400"
                />
              </div>
            )}

            {/* Phone Field */}
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
                  className="dbc-input text-xs placeholder:text-stone-400"
                />
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="dbc-input text-xs placeholder:text-stone-400"
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
                  className="dbc-input text-xs placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed" role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* Action */}
            <button
              type="submit"
              className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
            >
              Continue
            </button>
          </form>
        </>
      )}

      {/* STEP 2: Verification screen */}
      {step === 2 && (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-stone-900 font-serif">Verify Your Account</h2>
            <p className="text-xs text-stone-500">
              {channel === 'email' ? (
                <>We've sent a verification code to your email address: <strong className="text-stone-700">{maskEmail(email)}</strong>.</>
              ) : (
                <>We've sent a verification code to your phone number: <strong className="text-stone-700">{maskPhone(phone)}</strong>.</>
              )}
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-3.5 pt-2">
            {/* OTP input */}
            <div>
              <label htmlFor="reg-otp" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5 text-center">
                Verification Code
              </label>
              <input
                id="reg-otp"
                type="text"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="· · · · · ·"
                required
                className="dbc-input text-2xl font-mono tracking-[0.75em] text-center py-2.5 placeholder:text-stone-300 select-all"
              />
            </div>

            {/* Error alerts */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed" role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* Action */}
            <button
              type="submit"
              className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
            >
              Verify
            </button>
          </form>

          {/* Resend actions block */}
          <div className="pt-2 text-center text-xs text-stone-500 flex flex-col gap-1 items-center">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendClick}
              className={`font-bold text-emerald-700 hover:underline transition cursor-pointer ${
                resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-emerald-800'
              }`}
            >
              Resend Code {resendCooldown > 0 ? `(in ${resendCooldown}s)` : ''}
            </button>
          </div>

          {/* Correct detail action links */}
          <div className="pt-2 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="font-bold text-stone-500 hover:text-stone-900 transition cursor-pointer hover:underline"
            >
              {channel === 'email' ? '← Change email' : '← Change phone number'}
            </button>
          </div>
        </>
      )}

      {/* STEP 3: Verification success screen */}
      {step === 3 && (
        <div className="space-y-3 py-6 text-center">
          <div className="flex justify-center">
            <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-lg">
              ✓
            </span>
          </div>
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Verification Successful</h4>
          <p className="text-xs text-stone-600 leading-relaxed max-w-[280px] mx-auto">
            Your verification has been completed successfully! You can now log into your workspace console.
          </p>
        </div>
      )}

      {/* Switch back link */}
      <div className="pt-2 text-center border-t border-stone-100">
        <p className="text-xs text-stone-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
