import axios from 'axios';
import { axiosClient, setAccessToken } from './axiosClient';
import type { ApiResponse, LoginRequest, LoginResponse } from '../../types/auth/authTypes';

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

export const authService = {
  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.post<{ success: boolean; message: string }>('/api/auth/send-email-otp', { email });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to send email verification code'), { cause: error });
    }
  },

  async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.post<{ success: boolean; message: string }>('/api/auth/verify-email-otp', { email, otp });
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

  async logout(): Promise<void> {
    try {
      await axiosClient.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await axiosClient.post('/api/auth/logout-all');
    } finally {
      setAccessToken(null);
    }
  },

  async refresh(): Promise<LoginResponse> {
    try {
      const response = await axiosClient.post<LoginPayload>('/api/auth/refresh');
      if (response.data && 'success' in response.data && response.data.success === false) {
        throw new Error((response.data as unknown as Record<string, unknown>).message as string || 'Session expired');
      }
      const data = unwrapLoginResponse(response.data);
      setAccessToken(data.accessToken);
      return data;
    } catch (error) {
      setAccessToken(null);
      throw new Error(getErrorMessage(error, 'Unable to refresh session'), { cause: error });
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
