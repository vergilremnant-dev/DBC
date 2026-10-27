/**
 * Phase 1 — Phone OTP UI state machine and phone input normalisation.
 * Pure tests: no DOM, no Firebase network calls.
 */
import { describe, it, expect } from 'vitest';
import {
  MAX_OTP_RESENDS,
  RESEND_COOLDOWN_SECONDS,
  initialPhoneOtpState,
  phoneOtpReducer,
  type PhoneOtpAction,
  type PhoneOtpState,
} from '../../src/components/auth/phoneOtpState';
import { buildE164 } from '../../src/services/auth/phoneAuth';
import { mapFirebaseErrorMessage } from '../../src/components/auth/RegisterWizard';

const run = (actions: PhoneOtpAction[], from: PhoneOtpState = initialPhoneOtpState) =>
  actions.reduce(phoneOtpReducer, from);

const sent = () => run([{ type: 'SEND_START' }, { type: 'SEND_SUCCESS', phoneE164: '+919876543210' }]);
const coolDown = (s: PhoneOtpState) => run(Array(RESEND_COOLDOWN_SECONDS).fill({ type: 'TICK' }), s);

describe('Phase 1 — Phone OTP flow state', () => {
  describe('8. OTP resend / error handling', () => {
    it('failed OTP request stays on the phone step with a mapped error', () => {
      const s = run([{ type: 'SEND_START' }, { type: 'SEND_FAILURE', error: mapFirebaseErrorMessage('auth/too-many-requests') }]);
      expect(s.stage).toBe('phone');
      expect(s.error).toContain('Too many SMS requests');
      expect(s.busy).toBeNull();
    });

    it('resend is blocked during the countdown', () => {
      const s = run([{ type: 'RESEND_START' }], sent());
      expect(s.busy).toBeNull();
      expect(s.resendCount).toBe(0);
    });

    it('resend after countdown restarts the countdown and counts the attempt', () => {
      const s = run([{ type: 'RESEND_START' }, { type: 'RESEND_SUCCESS' }], coolDown(sent()));
      expect(s.cooldown).toBe(RESEND_COOLDOWN_SECONDS);
      expect(s.resendCount).toBe(1);
      expect(s.notice?.kind).toBe('otp_resent');
    });

    it(`stops after ${MAX_OTP_RESENDS} resends with a clear message`, () => {
      let s = sent();
      for (let i = 0; i < MAX_OTP_RESENDS; i++) {
        s = run([{ type: 'RESEND_START' }, { type: 'RESEND_SUCCESS' }], coolDown(s));
      }
      s = run([{ type: 'RESEND_START' }], coolDown(s));
      expect(s.busy).toBeNull();
      expect(s.error).toContain('resend limit');
    });

    it('resend failure keeps the user on the OTP step', () => {
      const s = run([{ type: 'RESEND_START' }, { type: 'RESEND_FAILURE', error: 'Network connection error.' }], coolDown(sent()));
      expect(s.stage).toBe('otp');
      expect(s.error).toBe('Network connection error.');
    });

    it('3. invalid / expired OTP keeps phone unverified and shows the mapped message', () => {
      const invalid = run([{ type: 'VERIFY_START' }, { type: 'VERIFY_FAILURE', error: mapFirebaseErrorMessage('auth/invalid-verification-code') }], sent());
      expect(invalid.stage).toBe('otp');
      expect(invalid.phoneVerified).toBe(false);
      expect(invalid.sessionEstablished).toBe(false);
      expect(invalid.error).toContain('invalid');
      expect(mapFirebaseErrorMessage('auth/code-expired')).toContain('expired');
    });

    it('change number resets the whole flow', () => {
      expect(run([{ type: 'CHANGE_NUMBER' }], sent())).toEqual(initialPhoneOtpState);
    });
  });

  describe('9. OTP success and warning-message state', () => {
    it('OTP request accepted: says "requested", never claims delivery, no SMS warning', () => {
      const s = sent();
      expect(s.stage).toBe('otp');
      expect(s.notice?.kind).toBe('otp_requested');
      expect(s.notice?.text).toMatch(/requested/i);
      expect(s.notice?.text).not.toMatch(/delivered|has been sent|we've sent/i);
      expect(s.notice?.text).not.toContain('9876543210'); // masked
      expect(s.smsHelpVisible).toBe(false);
      expect(s.phoneVerified).toBe(false);
      expect(s.sessionEstablished).toBe(false);
    });

    it('SMS help is only shown on explicit request after the countdown', () => {
      expect(run([{ type: 'SHOW_SMS_HELP' }], sent()).smsHelpVisible).toBe(false);
      expect(run([{ type: 'SHOW_SMS_HELP' }], coolDown(sent())).smsHelpVisible).toBe(true);
    });

    it('OTP verified is distinct from session established', () => {
      const s = run([{ type: 'VERIFY_START' }, { type: 'OTP_VERIFIED' }], sent());
      expect(s.phoneVerified).toBe(true);
      expect(s.sessionEstablished).toBe(false);
      expect(s.notice?.kind).toBe('phone_verified');
    });

    it('new number: verified -> profile step, still no session', () => {
      const s = run([{ type: 'OTP_VERIFIED' }, { type: 'REGISTRATION_REQUIRED' }], sent());
      expect(s.stage).toBe('profile');
      expect(s.sessionEstablished).toBe(false);
    });

    it('registration completed + session established are reported only after the backend succeeds', () => {
      const s = run(
        [{ type: 'OTP_VERIFIED' }, { type: 'REGISTRATION_REQUIRED' }, { type: 'REGISTER_START' }, { type: 'SESSION_ESTABLISHED', isNewUser: true }],
        sent()
      );
      expect(s.stage).toBe('complete');
      expect(s.sessionEstablished).toBe(true);
      expect(s.notice?.kind).toBe('account_created');
    });

    it('backend failure after verification keeps phone verified but no session', () => {
      const s = run([{ type: 'OTP_VERIFIED' }, { type: 'BACKEND_FAILURE', error: 'Please try again.' }], sent());
      expect(s.phoneVerified).toBe(true);
      expect(s.sessionEstablished).toBe(false);
      expect(s.notice?.kind).not.toBe('signed_in');
    });

    it('existing user: SESSION_ESTABLISHED reports "signed in"', () => {
      const s = run([{ type: 'OTP_VERIFIED' }, { type: 'SESSION_ESTABLISHED', isNewUser: false }], sent());
      expect(s.notice?.kind).toBe('signed_in');
    });
  });

  describe('Phone number validation', () => {
    it.each([
      ['+91', '9876543210', '+919876543210'],
      ['+91', '98765 43210', '+919876543210'],
      ['+91', '09876543210', '+919876543210'],
      ['+91', '919876543210', '+919876543210'],
      ['+1', '4155550123', '+14155550123'],
    ])('%s %s -> %s', (cc, raw, expected) => {
      expect(buildE164(cc, raw)).toEqual({ e164: expected });
    });

    it.each([
      ['+91', '12345'],
      ['+91', '5876543210'],
      ['+91', ''],
      ['91', '9876543210'],
      ['+1', '12'],
    ])('rejects %s %s', (cc, raw) => {
      expect(buildE164(cc, raw)).toHaveProperty('error');
    });
  });
});
