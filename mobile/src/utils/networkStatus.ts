/**
 * DBC Mobile Network Status & Offline State Tracker.
 * Tracks online/offline/reconnecting network state via browser events and API failure signals.
 */

import type { NetworkStatusState } from '../cache/cacheTypes.js';

type NetworkChangeListener = (status: NetworkStatusState) => void;

class MobileNetworkStatusTracker {
  private currentStatus: NetworkStatusState =
    typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE';
  private listeners = new Set<NetworkChangeListener>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setStatus('ONLINE'));
      window.addEventListener('offline', () => this.setStatus('OFFLINE'));
    }
  }

  getStatus(): NetworkStatusState {
    return this.currentStatus;
  }

  isOnline(): boolean {
    return this.currentStatus === 'ONLINE';
  }

  isOffline(): boolean {
    return this.currentStatus === 'OFFLINE';
  }

  setStatus(status: NetworkStatusState): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.notify();
    }
  }

  subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentStatus));
  }
}

export const mobileNetworkStatus = new MobileNetworkStatusTracker();
