/**
 * Mobile API Client for DBC Mobile Application.
 * Follows ADR-002: Re-use Existing Backend APIs & Client Architecture.
 */

import { axiosClient, getAccessToken, setAccessToken } from '../../../src/services/auth/axiosClient';
import { mobileEnvironment } from '../config/environment';
import { defaultStorageAdapter, StorageAdapter } from '../storage/StorageAdapter';

export class MobileApiClient {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  /**
   * Initializes client state by loading saved authentication token from secure storage.
   */
  async initialize(): Promise<string | null> {
    const savedToken = await this.storage.getItem('access_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }
    return getAccessToken();
  }

  /**
   * Saves access token into memory and secure storage.
   */
  async setToken(token: string | null): Promise<void> {
    setAccessToken(token);
    if (token) {
      await this.storage.setItem('access_token', token);
    } else {
      await this.storage.removeItem('access_token');
    }
  }

  /**
   * Perform HTTP GET request.
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await axiosClient.get<T>(url, { params });
    return response.data;
  }

  /**
   * Perform HTTP POST request.
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosClient.post<T>(url, data);
    return response.data;
  }

  /**
   * Perform HTTP PUT request.
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosClient.put<T>(url, data);
    return response.data;
  }

  /**
   * Perform HTTP DELETE request.
   */
  async delete<T>(url: string): Promise<T> {
    const response = await axiosClient.delete<T>(url);
    return response.data;
  }

  /**
   * Returns current active base URL.
   */
  getBaseUrl(): string {
    return mobileEnvironment.apiBaseUrl;
  }
}

export const mobileApiClient = new MobileApiClient();
