/**
 * StorageAdapter interface and platform implementations for DBC Mobile Application.
 * Follows ADR-003: Secure Storage Abstraction.
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

export class SecureStorageAdapter implements StorageAdapter {
  private fallback: StorageAdapter;

  constructor(fallback?: StorageAdapter) {
    this.fallback = fallback ?? new MemoryStorageAdapter();
  }

  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(`dbc_secure_${key}`);
      } catch {
        return this.fallback.getItem(key);
      }
    }
    return this.fallback.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`dbc_secure_${key}`, value);
        return;
      } catch {
        return this.fallback.setItem(key, value);
      }
    }
    return this.fallback.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`dbc_secure_${key}`);
        return;
      } catch {
        return this.fallback.removeItem(key);
      }
    }
    return this.fallback.removeItem(key);
  }

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = Object.keys(window.localStorage).filter(k => k.startsWith('dbc_secure_'));
        keys.forEach(k => window.localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    await this.fallback.clear();
  }
}

export const defaultStorageAdapter: StorageAdapter = new SecureStorageAdapter();
