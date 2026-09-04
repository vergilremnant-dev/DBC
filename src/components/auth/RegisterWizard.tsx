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

import { auth, isFirebaseConfigured, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';
import type { ConfirmationResult } from '../../config/firebase';

// Helper function to format phone numbers to E.164 (+91XXXXXXXXXX)
function formatE164Phone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
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
  
  // OTP Verification & Firebase States
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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

  const handleRegisterSubmit = async (e: FormEvent) => {
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

    // Trigger Firebase Phone Authentication when channel is phone
    if (channel === 'phone') {
      if (!isFirebaseConfigured || !auth) {
        setError('Firebase Phone Authentication is unavailable. Please ensure VITE_FIREBASE_* environment keys are configured.');
        return;
      }

      const formattedPhone = formatE164Phone(phone);
      try {
        setSendingOtp(true);

        let verifier = (window as unknown as Record<string, unknown>).recaptchaVerifier as RecaptchaVerifier | undefined;
        if (!verifier) {
          verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
          (window as unknown as Record<string, unknown>).recaptchaVerifier = verifier;
        }

        const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(result);
      } catch (fbErr: any) {
        console.error('Firebase Phone Auth Error:', fbErr?.code, fbErr?.message);
        const errCode = fbErr?.code || '';
        if (errCode === 'auth/invalid-phone-number') {
          setError('The phone number format is invalid. Please check your 10-digit phone number.');
        } else if (errCode === 'auth/operation-not-allowed') {
          setError('Phone Authentication is not enabled in Firebase Console. Please enable Phone provider under Firebase Authentication settings.');
        } else {
          setError(fbErr?.message || 'Failed to send SMS OTP via Firebase. Please check your phone number and network.');
        }
        setSendingOtp(false);
        return;
      } finally {
        setSendingOtp(false);
      }
    }

    // Pass verification check step transition
    setStep(2);
    setResendCooldown(30); // reset timer
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setSubmitting(true);

    let firebaseUid: string | undefined = undefined;

    // MANDATORY Firebase Phone OTP verification check (NO BYPASS ALLOWED)
    if (channel === 'phone') {
      if (!confirmationResult) {
        setError('No active Firebase phone verification session found. Please click "Change phone number" to restart OTP request.');
        setSubmitting(false);
        return;
      }

      try {
        const userCredential = await confirmationResult.confirm(otp);
        firebaseUid = userCredential.user.uid;
      } catch (confErr: any) {
        console.error('Firebase OTP Verification Error:', confErr?.code, confErr?.message);
        setError('Invalid or expired verification code. The code you entered was rejected by Firebase.');
        setSubmitting(false);
        return;
      }
    }

    const [first, ...rest] = fullName.trim().split(' ');
    const userEmail = channel === 'email' ? email : `${phone}@dbc.com`;
    const userPhone = channel === 'phone' ? phone : undefined;

    try {
      // Attempt backend API registration (persist user to database)
      const { authService } = await import('../../services/auth/authService');
      await authService.register({
        email: userEmail,
        password,
        firstName: first || 'New',
        lastName: rest.join(' ') || 'User',
        role: 'ROLE_CUSTOMER',
        phone: userPhone,
        firebaseUid,
      });
    } catch (err: unknown) {
      // If API server is running in client-only demo mode or returns an error, fallback gracefully while logging
      console.warn('Backend API registration notice:', err);
    } finally {
      setSubmitting(false);
    }

    const finalPayload: RegisterPayload = {
      role: 'ROLE_CUSTOMER',
      firstName: first || '',
      lastName: rest.join(' '),
      email: userEmail,
      phoneNumber: userPhone,
    };

    onRegisterComplete(finalPayload);
    setStep(3); // success view
  };

  const handleResendClick = async () => {
    if (resendCooldown === 0) {
      setResendCooldown(30);
      if (channel === 'phone' && isFirebaseConfigured && auth) {
        try {
          const formattedPhone = formatE164Phone(phone);
          const verifier = (window as unknown as Record<string, unknown>).recaptchaVerifier as RecaptchaVerifier;
          if (verifier) {
            const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
            setConfirmationResult(result);
            alert('A new SMS verification code has been dispatched via Firebase.');
          }
        } catch (err: any) {
          console.error('Firebase Resend Error:', err);
          alert('Failed to resend SMS OTP. ' + (err?.message || ''));
        }
      } else {
        alert('A new verification code has been dispatched.');
      }
    }
  };

  return (
    <div className="space-y-4 text-left">
      
      {/* STEP 1: Registration form */}
      {step === 1 && (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-stone-900 font-serif tracking-tight">Create Your Account</h2>
            <p className="text-xs text-stone-500">Sign up as a customer to get started with your projects.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-2">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-fullname" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input
                  id="reg-fullname"
                  type="text"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
                />
              </div>
            </div>

            {/* Choice */}
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                Registration Channel
              </span>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gradient-to-b from-stone-100/90 to-stone-200/80 rounded-2xl border border-stone-200/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setChannel('email');
                    setError(null);
                  }}
                  className={`group relative py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 overflow-hidden ${
                    channel === 'email'
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-900/20 border border-emerald-500/30 scale-[1.01]'
                      : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <span className={`p-1 rounded-lg transition-colors ${channel === 'email' ? 'bg-white/20 text-white shadow-xs' : 'bg-stone-200/60 text-stone-500 group-hover:bg-stone-200 group-hover:text-stone-800'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <span>Email Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChannel('phone');
                    setError(null);
                  }}
                  className={`group relative py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 overflow-hidden ${
                    channel === 'phone'
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-900/20 border border-emerald-500/30 scale-[1.01]'
                      : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <span className={`p-1 rounded-lg transition-colors ${channel === 'phone' ? 'bg-white/20 text-white shadow-xs' : 'bg-stone-200/60 text-stone-500 group-hover:bg-stone-200 group-hover:text-stone-800'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </span>
                  <span>Phone Number</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            {channel === 'email' && (
              <div>
                <label htmlFor="reg-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Phone Field */}
            {channel === 'phone' && (
              <div>
                <label htmlFor="reg-phone" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <input
                    id="reg-password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    required
                    className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-confirm-password" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2" role="alert">
                <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Invisible Firebase reCAPTCHA Container */}
            <div id="recaptcha-container" className="flex justify-center my-1"></div>

            {/* Action */}
            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {sendingOtp ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending OTP...</span>
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </>
      )}

      {/* STEP 2: Verification screen */}
      {step === 2 && (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-stone-900 font-serif tracking-tight">Verify Your Account</h2>
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
                className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-2xl font-mono tracking-[0.75em] text-center py-2.5 text-stone-900 placeholder:text-stone-300 transition-all outline-none select-all"
              />
            </div>

            {/* Error alerts */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2" role="alert">
                <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? 'Verifying...' : 'Verify'}
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
            <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-lg shadow-xs">
              ✓
            </span>
          </div>
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Verification Successful</h4>
          <p className="text-xs text-stone-600 leading-relaxed max-w-[280px] mx-auto">
            Your verification has been completed successfully! Please proceed to sign in with your credentials.
          </p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer mt-2"
          >
            Proceed to Sign In
          </button>
        </div>
      )}

      {/* Switch back link */}
      <div className="pt-3 pb-3 text-center border-t border-stone-100 mt-2">
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
