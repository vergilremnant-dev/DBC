import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Minimal in-memory localStorage for the storage helpers.
class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as any).localStorage = new MemoryStorage();

const { readScoped, writeScoped, clearAccountData, purgeLegacySharedKeys, scopedKey, LEGACY_SHARED_KEYS } = await import('../../src/utils/accountStorage.js');

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf-8');

describe('Account-scoped browser storage', () => {
  beforeEach(() => localStorage.clear());

  it('keeps each account\'s device data separate', () => {
    writeScoped('user-a', 'addresses', [{ name: 'A site' }]);
    expect(readScoped('user-a', 'addresses', [])).toEqual([{ name: 'A site' }]);
    expect(readScoped('user-b', 'addresses', [])).toEqual([]);
    expect(readScoped(null, 'addresses', 'none')).toBe('none');
    expect(localStorage.getItem(scopedKey('user-a', 'addresses'))).not.toBeNull();
  });

  it('sign-out wipes account data, legacy shared keys and drafts, but not unrelated keys', () => {
    writeScoped('user-a', 'addresses', [1]);
    writeScoped('user-b', 'preferences', { theme: 'Dark' });
    for (const k of LEGACY_SHARED_KEYS) localStorage.setItem(k, '{"firstName":"someone else"}');
    localStorage.setItem('dbc_project_request_draft', '{}');
    localStorage.setItem('dbc_fav_provider_1', 'true');
    localStorage.setItem('dbc_provider_view', 'PRO');
    clearAccountData();
    expect([...Array(localStorage.length).keys()].map((i) => localStorage.key(i))).toEqual(['dbc_provider_view']);
  });

  it('legacy shared keys can be purged on start-up', () => {
    localStorage.setItem('dbc_customer_personal', '{"firstName":"someone else"}');
    purgeLegacySharedKeys();
    expect(localStorage.getItem('dbc_customer_personal')).toBeNull();
  });
});

describe('Account pages read identity from the authenticated API only', () => {
  it('Settings never reads the old shared keys or hard-coded identity', () => {
    const src = read('src/pages/workspace/WorkspaceSettings.tsx');
    expect(src).not.toMatch(/dbc_customer_(personal|contact|avatar|addresses|preferences)/);
    expect(src).not.toMatch(/CUST-HYD|June 2026|John|9876543210|Gachibowli/);
    expect(src).toContain('useOwnProfile');
    expect(src).toContain('key={user?.id != null ? String(user.id)');
  });

  it('the professional profile is the signed-in professional\'s own record', () => {
    const src = read('src/pages/workspace/professional/ProfessionalProfile.tsx');
    expect(src).not.toMatch(/Apex Architecture|John Anderson|98765 43210|REG-10928374/);
    expect(src).toContain('useOwnProfile');
  });

  it('sign-out and account switches clear account data', () => {
    const slice = read('src/store/auth/authSlice.ts');
    expect(slice).toContain('if (previous && String(previous.id) !== String(user.id)) clearAccountData()');
    expect(slice).toContain('if (wipeAccountData) clearAccountData()');
    expect(slice).toContain('purgeLegacySharedKeys()');
  });

  it('stale profile responses for a previous account are ignored', () => {
    const hook = read('src/hooks/profile/useOwnProfile.ts');
    expect(hook).toContain('current.current === userId');
    expect(hook).toContain('if (state.owner !== userId) setState(initial<T>(userId))');
  });
});
