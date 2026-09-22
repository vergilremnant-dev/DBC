/**
 * DBC Mobile Authentication Types & State Machine Definitions.
 * Follows Module 34 Authentication Contract & Error Architecture.
 */

export type MobileAuthChallengeState =
  | 'IDLE'
  | 'SUBMITTING'
  | 'CHALLENGE_REQUIRED'
  | 'VERIFYING'
  | 'AUTHENTICATED';

export type MobileAuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_OTP'
  | 'EXPIRED_OTP'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SESSION_ERROR';

export interface MobileAuthError {
  code: MobileAuthErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface MobileLoginCredentials {
  email: string;
  password: string;
}

export interface MobileRegisterFormData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: 'customer' | 'contractor';
  phone?: string;
  preferredCity?: string;
}

export interface MobileOtpChallenge {
  email: string;
  verificationToken?: string;
  expiresInSeconds?: number;
  message?: string;
}

export interface PendingNavigationTarget {
  routeName: string;
  params?: Record<string, unknown>;
}
