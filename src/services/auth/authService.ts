import axios from 'axios';
import { axiosClient, refreshSession, setAccessToken } from './axiosClient';
import type { ApiResponse, AuthUser, LoginRequest, LoginResponse, PhoneRegisterRequest, PhoneSessionResponse } from '../../types/auth/authTypes';

type LoginPayload = LoginResponse | ApiResponse<LoginResponse>;

function unwrapLoginResponse(payload: LoginPayload): LoginResponse {
  if ('data' in payload && 'success' in payload) {
    return payload.data;
  }
  return payload as LoginResponse;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

/** Clears any leftover Firebase client sign-in (e.g. an abandoned OTP flow). Never blocks logout. */
async function endFirebaseClientSession(): Promise<void> {
  try {
    const { signOutFirebasePhoneUser } = await import('./phoneAuth');
    await signOutFirebasePhoneUser();
  } catch {
    // Firebase not configured or unavailable: nothing to clear.
  }
}

export const authService = {
  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.post<{ success: boolean; message: string }>('/api/auth/send-email-otp', { email });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to send email verification code'), { cause: error });
    }
  },

  async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string; verificationToken?: string }> {
    try {
      const response = await axiosClient.post<{ success: boolean; message: string; verificationToken?: string }>('/api/auth/verify-email-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Invalid or expired verification code'), { cause: error });
    }
  },

  async register(request: import('../../types/auth/authTypes').RegisterRequest): Promise<import('../../types/auth/authTypes').RegisterResponse> {
    try {
      const response = await axiosClient.post<{ success: boolean; message: string; verificationToken?: string }>('/api/auth/register', request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to complete registration'), { cause: error });
    }
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosClient.post<LoginPayload>('/api/auth/login', request);
      const data = unwrapLoginResponse(response.data);
      setAccessToken(data.accessToken);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to login'), { cause: error });
    }
  },

  async socialLoginBackend(idToken: string, providerName: string, email?: string | null, name?: string | null): Promise<LoginResponse> {
    try {
      const response = await axiosClient.post<LoginPayload>('/api/auth/social-login', {
        idToken,
        provider: providerName,
        email: email || undefined,
        name: name || undefined,
      });
      const data = unwrapLoginResponse(response.data);
      setAccessToken(data.accessToken);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, `Unable to complete ${providerName} sign-in`), { cause: error });
    }
  },

  /**
   * Exchange a Firebase phone ID token for a DBC session. The backend verifies the
   * token; unregistered numbers return REGISTRATION_REQUIRED without a session.
   */
  async phoneSession(firebaseIdToken: string): Promise<PhoneSessionResponse> {
    try {
      const response = await axiosClient.post<PhoneSessionResponse & { success: boolean }>('/api/auth/phone/session', { firebaseIdToken });
      if (response.data.status === 'AUTHENTICATED') {
        setAccessToken(response.data.accessToken);
      }
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to sign in with this phone number'), { cause: error });
    }
  },

  async phoneRegister(request: PhoneRegisterRequest): Promise<PhoneSessionResponse> {
    try {
      const response = await axiosClient.post<PhoneSessionResponse & { success: boolean }>('/api/auth/phone/register', request);
      if (response.data.status !== 'AUTHENTICATED') {
        throw new Error('Registration could not be completed');
      }
      setAccessToken(response.data.accessToken);
      return response.data;
    } catch (error) {
      if (error instanceof Error && !axios.isAxiosError(error)) throw error;
      throw new Error(getErrorMessage(error, 'Unable to complete registration'), { cause: error });
    }
  },

  async signInWithGoogle(): Promise<LoginResponse> {
    const { auth, GoogleAuthProvider, signInWithPopup, isFirebaseConfigured } = await import('../../config/firebase');
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is unavailable. Please ensure VITE_FIREBASE_* environment keys are configured.');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      return await this.socialLoginBackend(idToken, 'google', userCredential.user.email, userCredential.user.displayName);
    } catch (fbErr: any) {
      const errCode = fbErr?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in cancelled.');
      } else if (errCode === 'auth/operation-not-allowed' || errCode === 'auth/configuration-not-found') {
        throw new Error('Google sign-in is temporarily unavailable. Please enable Google provider in Firebase Console.');
      } else if (errCode === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser. Please allow pop-ups for this website and try again.');
      }
      if (fbErr?.message && !fbErr.message.includes('Firebase:')) {
        throw fbErr;
      }
      throw new Error('We couldn\'t sign you in with Google. Please try again.');
    }
  },

  async signInWithMicrosoft(): Promise<LoginResponse> {
    const { auth, OAuthProvider, signInWithPopup, isFirebaseConfigured } = await import('../../config/firebase');
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is unavailable. Please ensure VITE_FIREBASE_* environment keys are configured.');
    }

    try {
      const provider = new OAuthProvider('microsoft.com');
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      return await this.socialLoginBackend(idToken, 'microsoft', userCredential.user.email, userCredential.user.displayName);
    } catch (fbErr: any) {
      const errCode = fbErr?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in cancelled.');
      } else if (errCode === 'auth/operation-not-allowed' || errCode === 'auth/configuration-not-found') {
        throw new Error('Microsoft sign-in is temporarily unavailable. Please enable Microsoft provider in Firebase Console.');
      } else if (errCode === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser. Please allow pop-ups for this website and try again.');
      }
      if (fbErr?.message && !fbErr.message.includes('Firebase:')) {
        throw fbErr;
      }
      throw new Error('We couldn\'t sign you in with Microsoft. Please try again.');
    }
  },

  async signInWithApple(): Promise<LoginResponse> {
    const { auth, OAuthProvider, signInWithPopup, isFirebaseConfigured } = await import('../../config/firebase');
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is unavailable. Please ensure VITE_FIREBASE_* environment keys are configured.');
    }

    try {
      const provider = new OAuthProvider('apple.com');
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      return await this.socialLoginBackend(idToken, 'apple', userCredential.user.email, userCredential.user.displayName);
    } catch (fbErr: any) {
      const errCode = fbErr?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in cancelled.');
      } else if (errCode === 'auth/operation-not-allowed' || errCode === 'auth/configuration-not-found') {
        throw new Error('Apple sign-in is temporarily unavailable. Please enable Apple provider in Firebase Console.');
      } else if (errCode === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser. Please allow pop-ups for this website and try again.');
      }
      if (fbErr?.message && !fbErr.message.includes('Firebase:')) {
        throw fbErr;
      }
      throw new Error('We couldn\'t sign you in with Apple. Please try again.');
    }
  },

  async logout(): Promise<void> {
    try {
      await axiosClient.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
      await endFirebaseClientSession();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await axiosClient.post('/api/auth/logout-all');
    } finally {
      setAccessToken(null);
      await endFirebaseClientSession();
    }
  },

  /** Restores the DBC session from the httpOnly refresh cookie (no OTP needed while it is valid). */
  async refresh(): Promise<LoginResponse> {
    try {
      const session = await refreshSession();
      return { accessToken: session.accessToken, user: session.user as AuthUser };
    } catch (error) {
      const fallback = error instanceof Error && error.message ? error.message : 'Unable to refresh session';
      throw new Error(getErrorMessage(error, fallback), { cause: error });
    }
  },

  async getSessions() {
    try {
      const response = await axiosClient.get<{ success: boolean; data: unknown[] }>('/api/auth/sessions');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to retrieve sessions'), { cause: error });
    }
  },

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await axiosClient.delete('/api/auth/sessions', { data: { sessionId } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to revoke session'), { cause: error });
    }
  },
};
