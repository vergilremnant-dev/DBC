/**
 * Mobile Authentication Store & State Machine for DBC Mobile Application.
 * Tracks session lifecycle (initializing, unauthenticated, authenticated, expired)
 * and challenge states (IDLE, SUBMITTING, CHALLENGE_REQUIRED, VERIFYING, AUTHENTICATED).
 */

import { mobileApiClient } from '../api/mobileApiClient';
import { defaultStorageAdapter, StorageAdapter } from '../storage/StorageAdapter';
import {
  MobileAuthChallengeState,
  MobileAuthError,
  PendingNavigationTarget,
} from '../types/authMobileTypes';

export type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'expired';

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'contractor' | 'admin';
  avatarUrl?: string;
}

export interface AuthState {
  status: AuthStatus;
  user: MobileUser | null;
  error: MobileAuthError | string | null;
  challengeState: MobileAuthChallengeState;
  pendingTarget: PendingNavigationTarget | null;
}

type AuthListener = (state: AuthState) => void;

export class MobileAuthStore {
  private state: AuthState = {
    status: 'initializing',
    user: null,
    error: null,
    challengeState: 'IDLE',
    pendingTarget: null,
  };
  private listeners: Set<AuthListener> = new Set();
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getState(): AuthState {
    return { ...this.state };
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  setChallengeState(challengeState: MobileAuthChallengeState) {
    this.state = { ...this.state, challengeState };
    this.notify();
  }

  setPendingTarget(target: PendingNavigationTarget | null) {
    this.state = { ...this.state, pendingTarget: target };
    this.notify();
  }

  clearPendingTarget(): PendingNavigationTarget | null {
    const target = this.state.pendingTarget;
    this.state = { ...this.state, pendingTarget: null };
    this.notify();
    return target;
  }

  setAuthError(error: MobileAuthError | string | null) {
    this.state = { ...this.state, error, challengeState: 'IDLE' };
    this.notify();
  }

  async initialize(): Promise<void> {
    this.state = {
      status: 'initializing',
      user: null,
      error: null,
      challengeState: 'IDLE',
      pendingTarget: this.state.pendingTarget,
    };
    this.notify();

    try {
      const token = await mobileApiClient.initialize();
      const savedUserJson = await this.storage.getItem('user_profile');

      if (token && savedUserJson) {
        const user = JSON.parse(savedUserJson) as MobileUser;
        this.state = {
          status: 'authenticated',
          user,
          error: null,
          challengeState: 'AUTHENTICATED',
          pendingTarget: this.state.pendingTarget,
        };
      } else {
        this.state = {
          status: 'unauthenticated',
          user: null,
          error: null,
          challengeState: 'IDLE',
          pendingTarget: this.state.pendingTarget,
        };
      }
    } catch (err: unknown) {
      this.state = {
        status: 'unauthenticated',
        user: null,
        error: err instanceof Error ? err.message : 'Initialization failed',
        challengeState: 'IDLE',
        pendingTarget: this.state.pendingTarget,
      };
    } finally {
      this.notify();
    }
  }

  async setSession(user: MobileUser, token: string): Promise<void> {
    await mobileApiClient.setToken(token);
    await this.storage.setItem('user_profile', JSON.stringify(user));

    this.state = {
      status: 'authenticated',
      user,
      error: null,
      challengeState: 'AUTHENTICATED',
      pendingTarget: this.state.pendingTarget,
    };
    this.notify();
  }

  async logout(): Promise<void> {
    await mobileApiClient.setToken(null);
    await this.storage.removeItem('user_profile');

    this.state = {
      status: 'unauthenticated',
      user: null,
      error: null,
      challengeState: 'IDLE',
      pendingTarget: null,
    };
    this.notify();
  }

  markExpired(): void {
    this.state = {
      status: 'expired',
      user: this.state.user,
      error: { code: 'SESSION_ERROR', message: 'Session expired. Please log in again.' },
      challengeState: 'IDLE',
      pendingTarget: null,
    };
    this.notify();
  }
}

export const mobileAuthStore = new MobileAuthStore();
