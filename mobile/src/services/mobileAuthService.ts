/**
 * DBC Mobile Authentication Service.
 * Integrates with shared authService and mobileApiClient for mobile auth operations.
 */

import { authService } from '../../../src/services/auth/authService';
import { mobileApiClient } from '../api/mobileApiClient';
import { MobileUser } from '../state/authStore';
import {
  MobileAuthError,
  MobileAuthErrorCode,
  MobileLoginCredentials,
  MobileOtpChallenge,
  MobileRegisterFormData,
} from '../types/authMobileTypes';
import { AuthUser } from '../../../src/types/auth/authTypes';

export function resolveUserRole(rawRole?: string): 'customer' | 'contractor' | 'admin' {
  if (!rawRole) return 'customer';
  const upper = rawRole.toUpperCase();
  if (upper.includes('ADMIN')) return 'admin';
  if (
    upper.includes('CONTRACTOR') ||
    upper.includes('PROVIDER') ||
    upper.includes('WORKER') ||
    upper.includes('ARCHITECT')
  ) {
    return 'contractor';
  }
  return 'customer';
}

export function normalizeAuthError(err: unknown, defaultCode: MobileAuthErrorCode = 'SERVER_ERROR'): MobileAuthError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return err as MobileAuthError;
  }
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  let code: MobileAuthErrorCode = defaultCode;

  if (message.includes('Invalid credentials') || message.includes('password') || message.includes('user not found')) {
    code = 'INVALID_CREDENTIALS';
  } else if (message.includes('code') || message.includes('OTP')) {
    code = 'INVALID_OTP';
  } else if (message.includes('expired')) {
    code = 'EXPIRED_OTP';
  } else if (message.includes('Network') || message.includes('Failed to fetch')) {
    code = 'NETWORK_ERROR';
  }

  return { code, message };
}

export class MobileAuthService {
  /**
   * Authenticates user credentials via backend login endpoint.
   */
  async login(credentials: MobileLoginCredentials): Promise<{ user: MobileUser; token: string }> {
    if (!credentials.email || !credentials.password) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        fieldErrors: {
          ...(!credentials.email && { email: 'Email is required' }),
          ...(!credentials.password && { password: 'Password is required' }),
        },
      } as MobileAuthError;
    }

    try {
      const response = await authService.login({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const user: MobileUser = {
        id: String(response.user.id),
        email: response.user.email,
        name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email,
        role: resolveUserRole(response.user.role),
        avatarUrl: response.user.profileImageUrl || undefined,
      };

      return { user, token: response.accessToken };
    } catch (err: unknown) {
      throw normalizeAuthError(err, 'INVALID_CREDENTIALS');
    }
  }

  /**
   * Initiates registration by posting registration data to backend API.
   */
  async register(formData: MobileRegisterFormData): Promise<MobileOtpChallenge> {
    if (!formData.email || !formData.password || !formData.firstName) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required',
        fieldErrors: {
          ...(!formData.firstName && { firstName: 'First name is required' }),
          ...(!formData.email && { email: 'Email is required' }),
          ...(!formData.password && { password: 'Password is required' }),
        },
      } as MobileAuthError;
    }

    const backendRole = formData.role === 'contractor' ? 'ROLE_CONTRACTOR' : 'ROLE_CUSTOMER';

    try {
      const result = await authService.register({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName?.trim(),
        role: backendRole,
        phone: formData.phone?.trim(),
        preferredCity: formData.preferredCity?.trim(),
      });

      // Send OTP to email after registration submission
      await authService.sendEmailOtp(formData.email.trim());

      return {
        email: formData.email.trim(),
        verificationToken: result.verificationToken,
        expiresInSeconds: 300,
        message: 'Verification code sent to your email',
      };
    } catch (err: unknown) {
      throw normalizeAuthError(err, 'SERVER_ERROR');
    }
  }

  /**
   * Sends or resends email verification OTP code.
   */
  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.sendEmailOtp(email.trim());
    } catch (err: unknown) {
      throw normalizeAuthError(err, 'SERVER_ERROR');
    }
  }

  /**
   * Verifies the 6-digit OTP code against backend API.
   */
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string; verificationToken?: string }> {
    if (!otp || otp.trim().length !== 6) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Please enter a valid 6-digit verification code',
        fieldErrors: { otp: 'Code must be 6 digits' },
      } as MobileAuthError;
    }

    try {
      return await authService.verifyEmailOtp(email.trim(), otp.trim());
    } catch (err: unknown) {
      throw normalizeAuthError(err, 'INVALID_OTP');
    }
  }

  /**
   * Restores active authentication session or verifies token validity.
   */
  async restoreSession(): Promise<{ user: MobileUser; token: string } | null> {
    try {
      const activeToken = await mobileApiClient.initialize();
      if (!activeToken) {
        return null;
      }

      // Refresh or fetch profile to validate active session
      const refreshed = await authService.refresh();
      const user: MobileUser = {
        id: String(refreshed.user.id),
        email: refreshed.user.email,
        name: `${refreshed.user.firstName || ''} ${refreshed.user.lastName || ''}`.trim() || refreshed.user.email,
        role: resolveUserRole(refreshed.user.role),
        avatarUrl: refreshed.user.profileImageUrl || undefined,
      };

      return { user, token: refreshed.accessToken };
    } catch {
      await mobileApiClient.setToken(null);
      return null;
    }
  }

  /**
   * Performs complete session logout and token destruction.
   */
  async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch {
      // ignore network logout errors
    } finally {
      await mobileApiClient.setToken(null);
    }
  }

  /**
   * Invokes POST /api/user/delete-account to anonymize account and purge active session.
   */
  async deleteAccount(userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await mobileApiClient.post<{ success: boolean; message: string; deletedUserId?: string }>(
        '/user/delete-account',
        userId ? { userId } : {}
      );
      if (response.data.success) {
        await mobileApiClient.setToken(null);
      }
      return {
        success: response.data.success,
        message: response.data.message || 'Account deleted successfully',
      };
    } catch (err: unknown) {
      throw normalizeAuthError(err, 'SERVER_ERROR');
    }
  }
}

export const mobileAuthService = new MobileAuthService();
