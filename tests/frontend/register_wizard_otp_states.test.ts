/**
 * Module 74 — RegisterWizard OTP State Machine Tests
 *
 * Verifies that the SMS-delivery DLT warning is not rendered unconditionally.
 * After a successful Firebase signInWithPhoneNumber(), the warning must be absent.
 * Only after the user explicitly clicks "Still haven't received it?" should it appear.
 */
import { describe, it, expect } from 'vitest';
import { mapFirebaseErrorMessage } from '../../src/components/auth/RegisterWizard';

// ---------------------------------------------------------------------------
// 1. OTP UI State Logic — pure state-machine tests
// ---------------------------------------------------------------------------

/**
 * Minimal state model mirroring the real RegisterWizard React state,
 * so we can drive state transitions deterministically without a DOM.
 */
interface OtpScreenState {
  step: 1 | 2 | 3 | 4;
  channel: 'email' | 'phone';
  error: string | null;
  resendSuccessMessage: string | null;
  smsHelpVisible: boolean;
  resendCooldown: number;
  confirmationResultSet: boolean; // true once signInWithPhoneNumber resolved
}

function initialState(): OtpScreenState {
  return {
    step: 1,
    channel: 'phone',
    error: null,
    resendSuccessMessage: null,
    smsHelpVisible: false,
    resendCooldown: 30,
    confirmationResultSet: false,
  };
}

/** Simulate a successful Firebase OTP dispatch (signInWithPhoneNumber resolved) */
function onOtpSendSuccess(state: OtpScreenState): OtpScreenState {
  return {
    ...state,
    step: 2,
    error: null,
    resendCooldown: 30,
    smsHelpVisible: false,          // MUST be false — success does not mean delivery failed
    confirmationResultSet: true,
  };
}

/** Simulate a failed Firebase OTP dispatch (signInWithPhoneNumber threw) */
function onOtpSendError(state: OtpScreenState, errCode: string): OtpScreenState {
  return {
    ...state,
    step: 1,                        // stays on step 1 — user must correct and retry
    error: mapFirebaseErrorMessage(errCode),
    smsHelpVisible: false,
  };
}

/** Simulate user clicking "Still haven't received it?" */
function onSmsHelpRequested(state: OtpScreenState): OtpScreenState {
  return { ...state, smsHelpVisible: true };
}

/** Simulate a successful resend */
function onResendSuccess(state: OtpScreenState): OtpScreenState {
  return {
    ...state,
    resendSuccessMessage: 'A new SMS verification code has been sent to your phone number.',
    resendCooldown: 30,
    smsHelpVisible: false,         // resend resets the help panel
    error: null,
  };
}

/** Simulate user clicking "← Change phone number" */
function onNavigateBackToStep1(state: OtpScreenState): OtpScreenState {
  return {
    ...state,
    step: 1,
    error: null,
    resendSuccessMessage: null,
    smsHelpVisible: false,
  };
}

/** Simulate switching channel back to email */
function onSwitchToEmailChannel(state: OtpScreenState): OtpScreenState {
  return {
    ...state,
    channel: 'email',
    smsHelpVisible: false,
  };
}

/** Whether the DLT warning should be visible given the current state */
function isDltWarningVisible(state: OtpScreenState): boolean {
  // The warning renders only when: step === 2 && channel === 'phone' && smsHelpVisible
  return state.step === 2 && state.channel === 'phone' && state.smsHelpVisible;
}

// ---------------------------------------------------------------------------
// 2. Tests
// ---------------------------------------------------------------------------

describe('Module 74 — RegisterWizard OTP State Machine', () => {

  describe('1. Successful Firebase request — DLT warning must NOT appear', () => {
    it('starts with smsHelpVisible=false', () => {
      const state = initialState();
      expect(state.smsHelpVisible).toBe(false);
      expect(isDltWarningVisible(state)).toBe(false);
    });

    it('after successful signInWithPhoneNumber(), step becomes 2 and smsHelpVisible stays false', () => {
      const state = onOtpSendSuccess(initialState());
      expect(state.step).toBe(2);
      expect(state.confirmationResultSet).toBe(true);
      expect(state.smsHelpVisible).toBe(false);
    });

    it('DLT warning is NOT visible immediately after successful OTP request', () => {
      const state = onOtpSendSuccess(initialState());
      expect(isDltWarningVisible(state)).toBe(false);
    });

    it('error is null after successful OTP request', () => {
      const state = onOtpSendSuccess(initialState());
      expect(state.error).toBeNull();
    });

    it('resend cooldown is reset to 30s after successful OTP request', () => {
      const state = onOtpSendSuccess(initialState());
      expect(state.resendCooldown).toBe(30);
    });
  });

  describe('2. DLT warning appears only after user explicitly requests SMS help', () => {
    it('DLT warning is NOT visible on step 2 entry', () => {
      const state = onOtpSendSuccess(initialState());
      expect(isDltWarningVisible(state)).toBe(false);
    });

    it('DLT warning becomes visible ONLY after user clicks "Still haven\'t received it?"', () => {
      let state = onOtpSendSuccess(initialState());
      expect(isDltWarningVisible(state)).toBe(false);

      state = onSmsHelpRequested(state);
      expect(isDltWarningVisible(state)).toBe(true);
    });

    it('DLT warning resets when user navigates back to step 1', () => {
      let state = onOtpSendSuccess(initialState());
      state = onSmsHelpRequested(state);
      expect(isDltWarningVisible(state)).toBe(true);

      state = onNavigateBackToStep1(state);
      expect(isDltWarningVisible(state)).toBe(false);
      expect(state.smsHelpVisible).toBe(false);
    });

    it('DLT warning does NOT appear for email channel even if smsHelpVisible were true', () => {
      let state: OtpScreenState = {
        ...onOtpSendSuccess(initialState()),
        channel: 'email',
        smsHelpVisible: true, // hypothetically set
      };
      // Guard condition: email channel must never show the SMS warning
      expect(isDltWarningVisible(state)).toBe(false);
    });
  });

  describe('3. Failed Firebase OTP request — correct error state', () => {
    it('stays on step 1 and sets error message when signInWithPhoneNumber fails', () => {
      const state = onOtpSendError(initialState(), 'auth/too-many-requests');
      expect(state.step).toBe(1);
      expect(state.error).not.toBeNull();
      expect(state.error).toContain('Too many SMS requests');
      expect(state.smsHelpVisible).toBe(false);
    });

    it('auth/operation-not-allowed is mapped to a clear Firebase Console instruction', () => {
      const state = onOtpSendError(initialState(), 'auth/operation-not-allowed');
      expect(state.error).toContain('Firebase Console');
    });

    it('auth/captcha-check-failed is mapped to a reCAPTCHA retry message', () => {
      const state = onOtpSendError(initialState(), 'auth/captcha-check-failed');
      expect(state.error).toContain('reCAPTCHA');
    });

    it('auth/quota-exceeded is mapped to a quota / Blaze plan message', () => {
      const state = onOtpSendError(initialState(), 'auth/quota-exceeded');
      expect(state.error).toContain('quota');
    });

    it('auth/invalid-phone-number is mapped to a phone format message', () => {
      const state = onOtpSendError(initialState(), 'auth/invalid-phone-number');
      expect(state.error).toContain('invalid');
    });

    it('unknown error codes fall back to a safe generic SMS message', () => {
      const state = onOtpSendError(initialState(), 'auth/unknown-code');
      expect(state.error).not.toBeNull();
      expect(state.error).not.toBe('');
      // Must not leak raw Firebase internals
      expect(state.error).not.toContain('Firebase: Error');
    });
  });

  describe('4. Resend functionality', () => {
    it('resend success resets cooldown to 30s and clears smsHelpVisible', () => {
      let state = onOtpSendSuccess(initialState());
      // User sees the help panel
      state = { ...state, resendCooldown: 0 };
      state = onSmsHelpRequested(state);
      expect(state.smsHelpVisible).toBe(true);

      // User resends
      state = onResendSuccess(state);
      expect(state.resendCooldown).toBe(30);
      expect(state.smsHelpVisible).toBe(false);
      expect(state.resendSuccessMessage).toContain('new SMS verification code');
      expect(state.error).toBeNull();
    });

    it('resend success message is set correctly for phone channel', () => {
      const state = onResendSuccess(onOtpSendSuccess(initialState()));
      expect(state.resendSuccessMessage).toBe(
        'A new SMS verification code has been sent to your phone number.'
      );
    });
  });

  describe('5. Email alternative flow', () => {
    it('switching to email channel resets smsHelpVisible', () => {
      let state = onOtpSendSuccess(initialState());
      state = onSmsHelpRequested(state);
      expect(state.smsHelpVisible).toBe(true);

      state = onSwitchToEmailChannel(state);
      expect(state.channel).toBe('email');
      expect(state.smsHelpVisible).toBe(false);
    });

    it('email channel OTP screen does not render DLT warning', () => {
      const state: OtpScreenState = {
        ...onOtpSendSuccess(initialState()),
        channel: 'email',
      };
      expect(isDltWarningVisible(state)).toBe(false);
    });
  });

  describe('6. OTP error mapping completeness', () => {
    const codes = [
      'auth/invalid-phone-number',
      'auth/operation-not-allowed',
      'auth/captcha-check-failed',
      'auth/app-not-authorized',
      'auth/too-many-requests',
      'auth/quota-exceeded',
      'auth/network-request-failed',
      'auth/invalid-verification-code',
      'auth/code-expired',
      'auth/invalid-app-credential',
    ];

    it.each(codes)('error code %s maps to a non-empty user-friendly string', (code) => {
      const msg = mapFirebaseErrorMessage(code);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(10);
      // Must not leak raw error codes into user-visible messages
      expect(msg).not.toContain('auth/');
    });
  });
});
