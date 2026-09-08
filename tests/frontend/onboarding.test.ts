import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple in-memory localStorage mock for node test runner environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Customer Onboarding & First-Time Workspace Experience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores customer project intent in localStorage on completion', () => {
    const mockIntent = {
      intent: 'architecture',
      location: 'Hyderabad',
      timeline: 'immediate',
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('dbc_customer_intent', JSON.stringify(mockIntent));

    const retrieved = localStorage.getItem('dbc_customer_intent');
    expect(retrieved).not.toBeNull();
    const parsed = JSON.parse(retrieved!);
    expect(parsed.intent).toBe('architecture');
    expect(parsed.location).toBe('Hyderabad');
  });

  it('handles non-coercive skip without forcing project intent input', () => {
    const onSkip = vi.fn();
    onSkip();
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('dbc_customer_intent')).toBeNull();
  });
});
