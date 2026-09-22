/**
 * Mobile OTP Verification Screen Component & Controller for DBC Mobile Application.
 * Handles 6-digit OTP code input, verification submission, resend countdown, and error UX.
 */

import { mobileAuthService } from '../../services/mobileAuthService';
import { mobileAuthStore } from '../../state/authStore';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileAuthError } from '../../types/authMobileTypes';

export interface OtpScreenState {
  email: string;
  otpCode: string;
  isVerifying: boolean;
  isResending: boolean;
  resendCountdown: number;
  errorMessage: string | null;
  successMessage: string | null;
}

export class OtpVerificationScreenController {
  private state: OtpScreenState;

  constructor(email: string = '') {
    this.state = {
      email,
      otpCode: '',
      isVerifying: false,
      isResending: false,
      resendCountdown: 60,
      errorMessage: null,
      successMessage: null,
    };
  }

  getState(): OtpScreenState {
    return { ...this.state };
  }

  setEmail(email: string) {
    this.state.email = email;
  }

  setOtpCode(code: string) {
    // Only keep numeric digits up to 6 characters
    this.state.otpCode = code.replace(/\D/g, '').slice(0, 6);
    this.state.errorMessage = null;
  }

  decrementCountdown() {
    if (this.state.resendCountdown > 0) {
      this.state.resendCountdown -= 1;
    }
  }

  async verifyOtp(): Promise<boolean> {
    this.state.errorMessage = null;
    this.state.successMessage = null;

    if (!this.state.email || !this.state.otpCode || this.state.otpCode.length !== 6) {
      this.state.errorMessage = 'Please enter the complete 6-digit verification code sent to your email.';
      return false;
    }

    this.state.isVerifying = true;
    mobileAuthStore.setChallengeState('VERIFYING');

    try {
      const result = await mobileAuthService.verifyOtp(this.state.email, this.state.otpCode);
      if (result.success) {
        this.state.successMessage = 'Verification successful! Logging you in...';
        mobileAuthStore.setChallengeState('AUTHENTICATED');
        this.state.otpCode = ''; // Clear OTP code after verification
        return true;
      } else {
        this.state.errorMessage = result.message || 'Invalid verification code. Please try again.';
        return false;
      }
    } catch (err: unknown) {
      const authErr = err as MobileAuthError;
      this.state.errorMessage = authErr.message || 'Verification failed. Code may be invalid or expired.';
      mobileAuthStore.setAuthError(authErr);
      return false;
    } finally {
      this.state.isVerifying = false;
    }
  }

  async resendOtp(): Promise<boolean> {
    if (this.state.resendCountdown > 0 || this.state.isResending) {
      return false;
    }

    this.state.isResending = true;
    this.state.errorMessage = null;
    this.state.successMessage = null;

    try {
      await mobileAuthService.sendOtp(this.state.email);
      this.state.successMessage = 'A new 6-digit verification code has been sent to your email.';
      this.state.resendCountdown = 60;
      return true;
    } catch (err: unknown) {
      const authErr = err as MobileAuthError;
      this.state.errorMessage = authErr.message || 'Unable to resend code. Please try again later.';
      return false;
    } finally {
      this.state.isResending = false;
    }
  }
}

export const renderOtpVerificationScreenDescriptor = (state: OtpScreenState) => ({
  type: 'Screen',
  name: 'OtpVerificationScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Enter Verification Code',
    subtitle: `We sent a 6-digit code to ${state.email}`,
  },
  otpInput: {
    value: '••••••', // Obfuscated descriptor for security
    length: 6,
    minHeight: mobileTheme.touchTargets.inputHeight,
    focused: true,
  },
  button: {
    label: state.isVerifying ? 'Verifying code...' : 'Verify Code',
    disabled: state.isVerifying || state.otpCode.length !== 6,
    minHeight: mobileTheme.touchTargets.buttonHeight,
    backgroundColor: mobileTheme.colors.primary,
  },
  resendSection: {
    canResend: state.resendCountdown === 0 && !state.isResending,
    label: state.resendCountdown > 0 ? `Resend code in ${state.resendCountdown}s` : 'Resend Verification Code',
  },
  errorBanner: state.errorMessage,
  successBanner: state.successMessage,
  secondaryActions: [
    { label: 'Back to Login', route: 'Login' },
  ],
});
