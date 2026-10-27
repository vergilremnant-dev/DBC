/**
 * Phase 2 — Client session restoration (no OTP on every launch) and refresh safety.
 * axios is replaced with an in-memory double; no network is used.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

const { http } = vi.hoisted(() => {
  const http = {
    calls: 0,
    respond: async (): Promise<any> => ({ data: {} }),
  };
  const post = async (...args: unknown[]) => {
    http.calls += 1;
    return http.respond(...(args as []));
  };
  (globalThis as any).__axiosPost = post;
  return { http };
});

vi.mock('axios', () => {
  const post = (...a: unknown[]) => (globalThis as any).__axiosPost(...a);
  const client = {
    interceptors: { request: { use() {} }, response: { use() {} } },
    post,
    get: async () => ({ data: {} }),
    delete: async () => ({}),
  };
  return { default: { create: () => client, post, isAxiosError: (e: any) => Boolean(e?.isAxiosError) } };
});

describe('Phase 2 — Client session refresh', () => {
  beforeEach(async () => {
    http.calls = 0;
    const { setAccessToken } = await import('../../src/services/auth/axiosClient');
    setAccessToken(null);
  });

  it('restores the session from the refresh cookie without any OTP step', async () => {
    http.respond = async () => ({ data: { success: true, accessToken: 'access-1', user: { id: 'u1', role: 'ROLE_CUSTOMER' } } });
    const { authService } = await import('../../src/services/auth/authService');
    const { getAccessToken } = await import('../../src/services/auth/axiosClient');
    const session = await authService.refresh();
    expect(session.accessToken).toBe('access-1');
    expect(session.user.role).toBe('ROLE_CUSTOMER');
    expect(getAccessToken()).toBe('access-1');
  });

  it('concurrent refreshes (StrictMode double-mount, parallel 401s) share ONE request', async () => {
    let release: (v: unknown) => void = () => {};
    http.respond = () => new Promise((r) => (release = () => r({ data: { success: true, accessToken: 'access-2', user: {} } })));
    const { refreshSession } = await import('../../src/services/auth/axiosClient');
    const a = refreshSession();
    const b = refreshSession();
    const c = refreshSession();
    release(undefined);
    const results = await Promise.all([a, b, c]);
    expect(http.calls).toBe(1);
    expect(results.map((r) => r.accessToken)).toEqual(['access-2', 'access-2', 'access-2']);

    // After completion a later refresh issues a new request (no stale cached result).
    http.respond = async () => ({ data: { success: true, accessToken: 'access-3', user: {} } });
    expect((await refreshSession()).accessToken).toBe('access-3');
    expect(http.calls).toBe(2);
  });

  it('a 200 response with success:false is treated as an expired session and clears the token', async () => {
    const { refreshSession, setAccessToken, getAccessToken } = await import('../../src/services/auth/axiosClient');
    setAccessToken('stale');
    http.respond = async () => ({ data: { success: false, message: 'Session expired' } });
    await expect(refreshSession()).rejects.toThrow('Session expired');
    expect(getAccessToken()).toBeNull();
  });

  it('a response without an access token is rejected (never stores "undefined")', async () => {
    const { refreshSession, getAccessToken } = await import('../../src/services/auth/axiosClient');
    http.respond = async () => ({ data: { success: true } });
    await expect(refreshSession()).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
  });

  it('logout clears the in-memory token even if the server call fails', async () => {
    const { authService } = await import('../../src/services/auth/authService');
    const { setAccessToken, getAccessToken } = await import('../../src/services/auth/axiosClient');
    setAccessToken('access-live');
    http.respond = async () => {
      throw Object.assign(new Error('Network Error'), { isAxiosError: true });
    };
    await expect(authService.logout()).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
  });
});
