/**
 * Mobile Register Screen Component & Controller for DBC Mobile Application.
 * Requests required registration fields and initiates OTP verification flow.
 */

import { mobileAuthService } from '../../services/mobileAuthService';
import { mobileAuthStore } from '../../state/authStore';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileAuthError, MobileOtpChallenge, MobileRegisterFormData } from '../../types/authMobileTypes';

export interface RegisterScreenState extends MobileRegisterFormData {
  isSubmitting: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  challenge: MobileOtpChallenge | null;
}

export class RegisterScreenController {
  private state: RegisterScreenState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    preferredCity: '',
    isSubmitting: false,
    errorMessage: null,
    fieldErrors: {},
    challenge: null,
  };

  getState(): RegisterScreenState {
    return { ...this.state };
  }

  setField<K extends keyof MobileRegisterFormData>(field: K, value: MobileRegisterFormData[K]) {
    this.state[field] = value;
    if (this.state.fieldErrors[field]) {
      delete this.state.fieldErrors[field];
    }
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    if (!this.state.firstName || !this.state.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!this.state.email || !this.state.email.includes('@')) {
      errors.email = 'Valid email address is required';
    }
    if (!this.state.password || this.state.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    this.state.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async submitRegistration(): Promise<MobileOtpChallenge | null> {
    this.state.errorMessage = null;
    if (!this.validate()) {
      return null;
    }

    this.state.isSubmitting = true;
    mobileAuthStore.setChallengeState('SUBMITTING');

    try {
      const challenge = await mobileAuthService.register({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        email: this.state.email,
        password: this.state.password,
        role: this.state.role,
        phone: this.state.phone,
        preferredCity: this.state.preferredCity,
      });

      this.state.challenge = challenge;
      mobileAuthStore.setChallengeState('CHALLENGE_REQUIRED');

      // Clear password securely
      this.state.password = '';
      return challenge;
    } catch (err: unknown) {
      const authErr = err as MobileAuthError;
      this.state.errorMessage = authErr.message || 'Registration failed. Please try again.';
      if (authErr.fieldErrors) {
        this.state.fieldErrors = authErr.fieldErrors;
      }
      mobileAuthStore.setAuthError(authErr);
      return null;
    } finally {
      this.state.isSubmitting = false;
    }
  }
}

export const renderRegisterScreenDescriptor = (state: RegisterScreenState) => ({
  type: 'Screen',
  name: 'RegisterScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Create DBC Account',
    subtitle: 'Join as a Customer or Professional Contractor',
  },
  roleSelector: {
    options: [
      { label: 'Customer / Homeowner', value: 'customer' },
      { label: 'Professional / Contractor', value: 'contractor' },
    ],
    selected: state.role,
  },
  inputs: [
    {
      label: 'First Name',
      value: state.firstName,
      minHeight: mobileTheme.touchTargets.inputHeight,
      error: state.fieldErrors.firstName,
    },
    {
      label: 'Last Name (Optional)',
      value: state.lastName,
      minHeight: mobileTheme.touchTargets.inputHeight,
    },
    {
      label: 'Email Address',
      value: state.email,
      minHeight: mobileTheme.touchTargets.inputHeight,
      error: state.fieldErrors.email,
    },
    {
      label: 'Password',
      value: '••••••••',
      secureTextEntry: true,
      minHeight: mobileTheme.touchTargets.inputHeight,
      error: state.fieldErrors.password,
    },
    {
      label: 'Phone Number (Optional)',
      value: state.phone,
      minHeight: mobileTheme.touchTargets.inputHeight,
    },
  ],
  button: {
    label: state.isSubmitting ? 'Creating account...' : 'Continue to Verification',
    disabled: state.isSubmitting,
    minHeight: mobileTheme.touchTargets.buttonHeight,
    backgroundColor: mobileTheme.colors.primary,
  },
  errorBanner: state.errorMessage,
  secondaryActions: [
    { label: 'Already have an account? Sign In', route: 'Login' },
  ],
});
