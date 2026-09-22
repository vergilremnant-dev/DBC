/**
 * Mobile Login Screen Component & Controller for DBC Mobile Application.
 * Follows DBC Design Tokens, min 44px touch targets, and secure password handling.
 */

import { mobileAuthService } from '../../services/mobileAuthService';
import { mobileAuthStore } from '../../state/authStore';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileAuthError } from '../../types/authMobileTypes';

export interface LoginScreenState {
  email: string;
  password: string;
  isSubmitting: boolean;
  isSecurePasswordText: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export class LoginScreenController {
  private state: LoginScreenState = {
    email: '',
    password: '',
    isSubmitting: false,
    isSecurePasswordText: true,
    errorMessage: null,
    fieldErrors: {},
  };

  getState(): LoginScreenState {
    return { ...this.state };
  }

  setEmail(email: string) {
    this.state.email = email;
    if (this.state.fieldErrors.email) {
      delete this.state.fieldErrors.email;
    }
  }

  setPassword(password: string) {
    this.state.password = password;
    if (this.state.fieldErrors.password) {
      delete this.state.fieldErrors.password;
    }
  }

  togglePasswordVisibility() {
    this.state.isSecurePasswordText = !this.state.isSecurePasswordText;
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    if (!this.state.email || !this.state.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }
    if (!this.state.password || this.state.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    this.state.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async submitLogin(): Promise<boolean> {
    this.state.errorMessage = null;
    if (!this.validate()) {
      return false;
    }

    this.state.isSubmitting = true;
    mobileAuthStore.setChallengeState('SUBMITTING');

    try {
      const { user, token } = await mobileAuthService.login({
        email: this.state.email,
        password: this.state.password,
      });

      // Clear password state securely upon completion
      this.state.password = '';
      await mobileAuthStore.setSession(user, token);
      return true;
    } catch (err: unknown) {
      const authErr = err as MobileAuthError;
      this.state.errorMessage = authErr.message || 'Login failed. Please check your credentials.';
      if (authErr.fieldErrors) {
        this.state.fieldErrors = authErr.fieldErrors;
      }
      mobileAuthStore.setAuthError(authErr);
      return false;
    } finally {
      this.state.isSubmitting = false;
    }
  }
}

export const renderLoginScreenDescriptor = (state: LoginScreenState) => ({
  type: 'Screen',
  name: 'LoginScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Sign In to DBC',
    subtitle: 'Access your construction workspace',
  },
  inputs: [
    {
      label: 'Email Address',
      value: state.email,
      placeholder: 'you@example.com',
      minHeight: mobileTheme.touchTargets.inputHeight,
      error: state.fieldErrors.email,
    },
    {
      label: 'Password',
      value: state.isSecurePasswordText ? '••••••••' : state.password,
      secureTextEntry: state.isSecurePasswordText,
      minHeight: mobileTheme.touchTargets.inputHeight,
      error: state.fieldErrors.password,
    },
  ],
  button: {
    label: state.isSubmitting ? 'Signing in...' : 'Sign In',
    disabled: state.isSubmitting,
    minHeight: mobileTheme.touchTargets.buttonHeight,
    backgroundColor: mobileTheme.colors.primary,
  },
  errorBanner: state.errorMessage,
  secondaryActions: [
    { label: "Don't have an account? Register", route: 'Register' },
  ],
});
