import { useEffect, useReducer, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from 'firebase/auth';
import type { ConfirmationResult } from '../../config/firebase';
import { useAuthDispatch } from '../../hooks/auth/useAuthStore';
import { phoneRegisterThunk, phoneSessionThunk } from '../../store/auth/authSlice';
import type { AuthUser } from '../../types/auth/authTypes';
import { mapFirebaseErrorMessage } from './RegisterWizard';
import {
  SUPPORTED_COUNTRY_CODES,
  buildE164,
  confirmPhoneOtp,
  mapPhoneOtpError,
  requestPhoneOtp,
  resetPhoneRecaptcha,
  signOutFirebasePhoneUser,
} from '../../services/auth/phoneAuth';
import {
  MAX_OTP_RESENDS,
  canResend,
  initialPhoneOtpState,
  maskPhoneE164,
  phoneOtpReducer,
} from './phoneOtpState';

const RECAPTCHA_CONTAINER_ID = 'dbc-phone-recaptcha';

interface PhoneOtpAuthProps {
  /** 'login' and 'register' share one flow; only the heading differs. */
  mode?: 'login' | 'register';
  onAuthenticated: (user: AuthUser, isNewUser: boolean) => void;
  /** Optional link for existing email/password accounts. */
  onUseEmailLogin?: () => void;
  onSwitchMode?: () => void;
}

const inputClass =
  'w-full min-h-[44px] bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 px-3.5 transition-all outline-none';
const labelClass = 'block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5';
const primaryButtonClass =
  'w-full min-h-[44px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer';

export function PhoneOtpAuth({ mode = 'login', onAuthenticated, onUseEmailLogin, onSwitchMode }: PhoneOtpAuthProps) {
  const dispatch = useAuthDispatch();
  const [state, send] = useReducer(phoneOtpReducer, initialPhoneOtpState);

  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const firebaseUserRef = useRef<User | null>(null);

  // Resend countdown
  useEffect(() => {
    if (state.stage !== 'otp' || state.cooldown <= 0) return;
    const timer = setTimeout(() => send({ type: 'TICK' }), 1000);
    return () => clearTimeout(timer);
  }, [state.stage, state.cooldown]);

  // Clean up the invisible reCAPTCHA when the flow unmounts
  useEffect(() => () => resetPhoneRecaptcha(), []);

  const busy = state.busy !== null;

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    const built = buildE164(countryCode, phoneInput);
    if ('error' in built) {
      send({ type: 'VALIDATION_ERROR', error: built.error });
      return;
    }
    send({ type: 'SEND_START' });
    try {
      confirmationRef.current = await requestPhoneOtp(built.e164, RECAPTCHA_CONTAINER_ID);
      setOtp('');
      send({ type: 'SEND_SUCCESS', phoneE164: built.e164 });
    } catch (err) {
      confirmationRef.current = null;
      send({ type: 'SEND_FAILURE', error: mapPhoneOtpError(err, mapFirebaseErrorMessage) });
    }
  }

  async function handleResend() {
    if (!state.phoneE164) return;
    if (!canResend(state)) {
      send({ type: 'RESEND_START' }); // surfaces the resend-limit message when applicable
      return;
    }
    send({ type: 'RESEND_START' });
    try {
      confirmationRef.current = await requestPhoneOtp(state.phoneE164, RECAPTCHA_CONTAINER_ID);
      setOtp('');
      send({ type: 'RESEND_SUCCESS' });
    } catch (err) {
      send({ type: 'RESEND_FAILURE', error: mapPhoneOtpError(err, mapFirebaseErrorMessage) });
    }
  }

  async function establishSession(user: User) {
    const idToken = await user.getIdToken();
    const result = await dispatch(phoneSessionThunk(idToken));
    if (phoneSessionThunk.rejected.match(result)) {
      send({ type: 'BACKEND_FAILURE', error: result.payload || 'Unable to sign in with this phone number.' });
      return;
    }
    if (result.payload.status === 'REGISTRATION_REQUIRED') {
      send({ type: 'REGISTRATION_REQUIRED' });
      return;
    }
    send({ type: 'SESSION_ESTABLISHED', isNewUser: false });
    await signOutFirebasePhoneUser();
    onAuthenticated(result.payload.user, false);
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      send({ type: 'VALIDATION_ERROR', error: 'Please enter the 6-digit code.' });
      return;
    }
    if (!confirmationRef.current) {
      send({ type: 'VERIFY_FAILURE', error: 'This code request is no longer active. Please request a new code.' });
      return;
    }
    send({ type: 'VERIFY_START' });
    let user: User;
    try {
      user = await confirmPhoneOtp(confirmationRef.current, otp);
    } catch (err) {
      send({ type: 'VERIFY_FAILURE', error: mapPhoneOtpError(err, mapFirebaseErrorMessage) });
      return;
    }
    firebaseUserRef.current = user;
    send({ type: 'OTP_VERIFIED' });
    try {
      await establishSession(user);
    } catch {
      send({ type: 'BACKEND_FAILURE', error: 'We could not reach DBC to finish signing in. Please try again.' });
    }
  }

  async function handleRetrySession() {
    if (!firebaseUserRef.current) return;
    send({ type: 'OTP_VERIFIED' });
    try {
      await establishSession(firebaseUserRef.current);
    } catch {
      send({ type: 'BACKEND_FAILURE', error: 'We could not reach DBC to finish signing in. Please try again.' });
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      send({ type: 'VALIDATION_ERROR', error: 'Please enter your first name.' });
      return;
    }
    const user = firebaseUserRef.current;
    if (!user) {
      send({ type: 'BACKEND_FAILURE', error: 'Your phone verification has ended. Please verify your number again.' });
      return;
    }
    send({ type: 'REGISTER_START' });
    try {
      // Always send a fresh ID token; the backend derives UID and phone from it.
      const firebaseIdToken = await user.getIdToken();
      const result = await dispatch(
        phoneRegisterThunk({ firebaseIdToken, firstName: firstName.trim(), lastName: lastName.trim() || undefined }),
      );
      if (phoneRegisterThunk.rejected.match(result) || result.payload.status !== 'AUTHENTICATED') {
        const message = phoneRegisterThunk.rejected.match(result) ? result.payload : undefined;
        send({ type: 'BACKEND_FAILURE', error: message || 'Unable to complete registration.' });
        return;
      }
      send({ type: 'SESSION_ESTABLISHED', isNewUser: result.payload.isNewUser });
      await signOutFirebasePhoneUser();
      onAuthenticated(result.payload.user, result.payload.isNewUser);
    } catch {
      send({ type: 'BACKEND_FAILURE', error: 'We could not reach DBC to create your account. Please try again.' });
    }
  }

  function handleChangeNumber() {
    confirmationRef.current = null;
    firebaseUserRef.current = null;
    setOtp('');
    void signOutFirebasePhoneUser();
    send({ type: 'CHANGE_NUMBER' });
  }

  const heading =
    state.stage === 'profile'
      ? 'Complete Your Account'
      : state.stage === 'otp'
        ? 'Enter Verification Code'
        : mode === 'register'
          ? 'Create Your Account'
          : 'Sign In';

  return (
    <div className="space-y-4 text-left">
      <div id={RECAPTCHA_CONTAINER_ID} className="flex justify-center" />

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-stone-900 font-serif tracking-tight">{heading}</h2>
        {state.stage === 'phone' && (
          <p className="text-xs text-stone-500">
            {mode === 'register'
              ? 'Verify your mobile number to create your DBC account.'
              : 'Enter your mobile number. We will verify it with a one-time code.'}
          </p>
        )}
      </div>

      {state.notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 leading-relaxed"
          role="status"
          data-notice={state.notice.kind}
        >
          {state.notice.text}
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed" role="alert">
          {state.error}
        </div>
      )}

      {state.stage === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="phone-otp-number" className={labelClass}>Mobile Number</label>
            <div className="flex gap-2">
              <select
                aria-label="Country code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="min-h-[44px] bg-stone-50/50 border border-stone-200 focus:border-emerald-600 rounded-xl text-xs font-semibold text-stone-800 px-2.5 outline-none"
              >
                {SUPPORTED_COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                id="phone-otp-number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder={countryCode === '+91' ? '10-digit mobile number' : 'Mobile number'}
                className={inputClass}
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {state.busy === 'sending' ? 'Requesting Code...' : 'Send Verification Code'}
          </button>
        </form>
      )}

      {state.stage === 'otp' && (
        <>
          <form onSubmit={handleVerifyOtp} className="space-y-3.5" noValidate>
            <div>
              <label htmlFor="phone-otp-code" className={`${labelClass} text-center`}>6-Digit Code</label>
              <input
                id="phone-otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                disabled={state.phoneVerified}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="· · · · · ·"
                className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-2xl font-mono tracking-[0.75em] text-center py-2.5 text-stone-900 placeholder:text-stone-300 transition-all outline-none"
              />
            </div>
            {state.phoneVerified && !state.sessionEstablished && state.busy === null ? (
              <button type="button" onClick={handleRetrySession} className={primaryButtonClass}>
                Try Again
              </button>
            ) : (
              <button type="submit" disabled={busy || state.phoneVerified} className={primaryButtonClass}>
                {state.busy === 'verifying'
                  ? 'Verifying Code...'
                  : state.busy === 'session'
                    ? 'Signing You In...'
                    : 'Verify & Continue'}
              </button>
            )}
          </form>

          {!state.phoneVerified && (
            <div className="pt-1 text-center text-xs text-stone-500 flex flex-col gap-1 items-center">
              <span>Didn't get the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={busy || state.cooldown > 0}
                className="font-bold text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {state.busy === 'resending'
                  ? 'Requesting Code...'
                  : state.cooldown > 0
                    ? `Resend code in ${state.cooldown}s`
                    : `Resend code${state.resendCount > 0 ? ` (${MAX_OTP_RESENDS - state.resendCount} left)` : ''}`}
              </button>
              {state.cooldown === 0 && !state.smsHelpVisible && state.busy === null && (
                <button
                  type="button"
                  onClick={() => send({ type: 'SHOW_SMS_HELP' })}
                  className="text-stone-400 hover:text-stone-600 underline underline-offset-2 cursor-pointer mt-0.5"
                >
                  Still haven't received it?
                </button>
              )}
              {state.smsHelpVisible && (
                <p className="mt-1 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-relaxed">
                  Check that {maskPhoneE164(state.phoneE164)} is correct and can receive SMS. Messages can be delayed by your
                  mobile network. You can resend the code or change the number.
                </p>
              )}
            </div>
          )}

          <div className="text-center text-xs">
            <button
              type="button"
              onClick={handleChangeNumber}
              disabled={state.busy === 'verifying' || state.busy === 'session'}
              className="font-bold text-stone-500 hover:text-stone-900 hover:underline cursor-pointer disabled:opacity-50"
            >
              ← Change phone number
            </button>
          </div>
        </>
      )}

      {state.stage === 'profile' && (
        <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
          <div className="text-xs text-stone-600">
            Mobile: <strong className="text-stone-800">{maskPhoneE164(state.phoneE164)}</strong>{' '}
            <span className="text-emerald-700 font-semibold">✓ Verified</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone-reg-first" className={labelClass}>First Name</label>
              <input
                id="phone-reg-first"
                type="text"
                autoComplete="given-name"
                maxLength={50}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone-reg-last" className={labelClass}>Last Name (optional)</label>
              <input
                id="phone-reg-last"
                type="text"
                autoComplete="family-name"
                maxLength={50}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {state.busy === 'registering' ? 'Creating Account...' : 'Create Account'}
          </button>
          <div className="text-center text-xs">
            <button type="button" onClick={handleChangeNumber} className="font-bold text-stone-500 hover:text-stone-900 hover:underline cursor-pointer">
              ← Use a different number
            </button>
          </div>
        </form>
      )}

      {state.stage === 'phone' && (onUseEmailLogin || onSwitchMode) && (
        <div className="pt-2 space-y-2 text-center text-xs text-stone-500">
          {onSwitchMode && (
            <p>
              {mode === 'register' ? 'Already have an account?' : 'New to DBC?'}{' '}
              <button type="button" onClick={onSwitchMode} className="font-bold text-emerald-700 hover:underline cursor-pointer">
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          )}
          {onUseEmailLogin && (
            <button type="button" onClick={onUseEmailLogin} className="font-semibold text-stone-500 hover:text-stone-800 underline underline-offset-2 cursor-pointer">
              Sign in with email and password instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
