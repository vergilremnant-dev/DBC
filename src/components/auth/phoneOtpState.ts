/**
 * Pure state machine for the phone OTP sign-in / sign-up flow.
 *
 * Keeps distinct, honest states for each milestone:
 *  - OTP request accepted by Firebase (NOT the same as SMS delivered)
 *  - OTP verified by Firebase (phone ownership proven on the client)
 *  - DBC account created (backend)
 *  - DBC session established (backend issued access + refresh session)
 */

export const RESEND_COOLDOWN_SECONDS = 30;
export const MAX_OTP_RESENDS = 3;

export type PhoneOtpStage = 'phone' | 'otp' | 'profile' | 'complete';
export type PhoneOtpBusy = null | 'sending' | 'resending' | 'verifying' | 'session' | 'registering';

export type PhoneOtpNoticeKind =
  | 'otp_requested'
  | 'otp_resent'
  | 'phone_verified'
  | 'signed_in'
  | 'account_created';

export interface PhoneOtpState {
  stage: PhoneOtpStage;
  phoneE164: string | null;
  busy: PhoneOtpBusy;
  error: string | null;
  notice: { kind: PhoneOtpNoticeKind; text: string } | null;
  cooldown: number;
  resendCount: number;
  smsHelpVisible: boolean;
  phoneVerified: boolean;
  sessionEstablished: boolean;
  isNewUser: boolean;
}

export type PhoneOtpAction =
  | { type: 'SEND_START' }
  | { type: 'SEND_SUCCESS'; phoneE164: string }
  | { type: 'SEND_FAILURE'; error: string }
  | { type: 'RESEND_START' }
  | { type: 'RESEND_SUCCESS' }
  | { type: 'RESEND_FAILURE'; error: string }
  | { type: 'TICK' }
  | { type: 'VERIFY_START' }
  | { type: 'VERIFY_FAILURE'; error: string }
  | { type: 'OTP_VERIFIED' }
  | { type: 'REGISTRATION_REQUIRED' }
  | { type: 'REGISTER_START' }
  | { type: 'SESSION_ESTABLISHED'; isNewUser: boolean }
  | { type: 'BACKEND_FAILURE'; error: string }
  | { type: 'SHOW_SMS_HELP' }
  | { type: 'CHANGE_NUMBER' }
  | { type: 'VALIDATION_ERROR'; error: string };

export const initialPhoneOtpState: PhoneOtpState = {
  stage: 'phone',
  phoneE164: null,
  busy: null,
  error: null,
  notice: null,
  cooldown: 0,
  resendCount: 0,
  smsHelpVisible: false,
  phoneVerified: false,
  sessionEstablished: false,
  isNewUser: false,
};

export function maskPhoneE164(phoneE164: string | null): string {
  if (!phoneE164) return '';
  const visible = phoneE164.slice(-4);
  const prefix = phoneE164.startsWith('+91') ? '+91 ' : '';
  return `${prefix}******${visible}`;
}

export function canResend(state: PhoneOtpState): boolean {
  return state.stage === 'otp' && state.busy === null && state.cooldown === 0 && state.resendCount < MAX_OTP_RESENDS;
}

export function phoneOtpReducer(state: PhoneOtpState, action: PhoneOtpAction): PhoneOtpState {
  switch (action.type) {
    case 'SEND_START':
      return { ...state, busy: 'sending', error: null, notice: null };
    case 'SEND_SUCCESS':
      return {
        ...state,
        stage: 'otp',
        phoneE164: action.phoneE164,
        busy: null,
        error: null,
        cooldown: RESEND_COOLDOWN_SECONDS,
        resendCount: 0,
        smsHelpVisible: false,
        notice: {
          kind: 'otp_requested',
          text: `Verification code requested for ${maskPhoneE164(action.phoneE164)}. SMS can take up to a minute to arrive.`,
        },
      };
    case 'SEND_FAILURE':
      return { ...state, stage: 'phone', busy: null, error: action.error, notice: null, smsHelpVisible: false };

    case 'RESEND_START':
      if (!canResend(state)) {
        if (state.resendCount >= MAX_OTP_RESENDS) {
          return {
            ...state,
            error: "You've reached the resend limit for this number. Check the number or try again later.",
          };
        }
        return state;
      }
      return { ...state, busy: 'resending', error: null, notice: null };
    case 'RESEND_SUCCESS':
      return {
        ...state,
        busy: null,
        cooldown: RESEND_COOLDOWN_SECONDS,
        resendCount: state.resendCount + 1,
        smsHelpVisible: false,
        notice: {
          kind: 'otp_resent',
          text: `A new code was requested for ${maskPhoneE164(state.phoneE164)}.`,
        },
      };
    case 'RESEND_FAILURE':
      return { ...state, busy: null, error: action.error, notice: null };

    case 'TICK':
      return state.cooldown > 0 ? { ...state, cooldown: state.cooldown - 1 } : state;

    case 'VERIFY_START':
      return { ...state, busy: 'verifying', error: null };
    case 'VERIFY_FAILURE':
      return { ...state, busy: null, error: action.error };

    case 'OTP_VERIFIED':
      return {
        ...state,
        busy: 'session',
        error: null,
        phoneVerified: true,
        smsHelpVisible: false,
        notice: { kind: 'phone_verified', text: 'Phone number verified.' },
      };
    case 'REGISTRATION_REQUIRED':
      return {
        ...state,
        stage: 'profile',
        busy: null,
        notice: {
          kind: 'phone_verified',
          text: 'Phone number verified. Add your name to create your DBC account.',
        },
      };
    case 'REGISTER_START':
      return { ...state, busy: 'registering', error: null };
    case 'SESSION_ESTABLISHED':
      return {
        ...state,
        stage: 'complete',
        busy: null,
        error: null,
        sessionEstablished: true,
        isNewUser: action.isNewUser,
        notice: action.isNewUser
          ? { kind: 'account_created', text: 'Your DBC account has been created and you are signed in.' }
          : { kind: 'signed_in', text: 'You are signed in.' },
      };
    case 'BACKEND_FAILURE':
      // Phone verification stays true; no session was established.
      return { ...state, busy: null, error: action.error, sessionEstablished: false };

    case 'SHOW_SMS_HELP':
      return state.stage === 'otp' && state.cooldown === 0 ? { ...state, smsHelpVisible: true } : state;

    case 'CHANGE_NUMBER':
      return { ...initialPhoneOtpState };

    case 'VALIDATION_ERROR':
      return { ...state, error: action.error };

    default:
      return state;
  }
}
