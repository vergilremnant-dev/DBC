import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

import { MemoryStorageAdapter, SecureStorageAdapter } from '../../mobile/src/storage/StorageAdapter';
import { mobileEnvironment } from '../../mobile/src/config/environment';
import { MobileApiClient } from '../../mobile/src/api/mobileApiClient';
import { MobileAuthStore, MobileUser } from '../../mobile/src/state/authStore';
import { mobileTheme } from '../../mobile/src/theme/themeTokens';
import { platformAdapters } from '../../mobile/src/platform/adapters';
import { determineInitialNavigationStack, mobileNavigationRoutes } from '../../mobile/src/navigation/rootNavigation';
import { mobileBaseComponents } from '../../mobile/src/components/baseComponents';

describe('Module 33 — Native Mobile Foundation & Architecture Verification', () => {
  describe('1. StorageAdapter', () => {
    it('should set, get, remove, and clear items using MemoryStorageAdapter', async () => {
      const storage = new MemoryStorageAdapter();
      await storage.setItem('testKey', 'testVal');
      expect(await storage.getItem('testKey')).toBe('testVal');

      await storage.removeItem('testKey');
      expect(await storage.getItem('testKey')).toBeNull();

      await storage.setItem('k1', 'v1');
      await storage.setItem('k2', 'v2');
      await storage.clear();
      expect(await storage.getItem('k1')).toBeNull();
      expect(await storage.getItem('k2')).toBeNull();
    });

    it('should handle SecureStorageAdapter gracefully with fallback', async () => {
      const storage = new SecureStorageAdapter();
      await storage.setItem('secureToken', 'token123');
      expect(await storage.getItem('secureToken')).toBe('token123');
      await storage.removeItem('secureToken');
      expect(await storage.getItem('secureToken')).toBeNull();
    });
  });

  describe('2. Mobile Environment Configuration', () => {
    it('should resolve environment configuration defaults', () => {
      expect(mobileEnvironment.environment).toBeDefined();
      expect(mobileEnvironment.apiBaseUrl).toBeDefined();
      expect(mobileEnvironment.timeoutMs).toBe(15000);
      expect(mobileEnvironment.enablePushNotifications).toBe(true);
      expect(mobileEnvironment.enableBiometrics).toBe(true);
    });
  });

  describe('3. Mobile API Client', () => {
    it('should initialize and manage tokens with storage adapter', async () => {
      const memoryStorage = new MemoryStorageAdapter();
      const client = new MobileApiClient(memoryStorage);

      await memoryStorage.setItem('access_token', 'initial_token');
      const loadedToken = await client.initialize();
      expect(loadedToken).toBe('initial_token');

      await client.setToken('new_token');
      expect(await memoryStorage.getItem('access_token')).toBe('new_token');

      await client.setToken(null);
      expect(await memoryStorage.getItem('access_token')).toBeNull();
    });

    it('should return API base URL', () => {
      const client = new MobileApiClient();
      expect(client.getBaseUrl()).toBe(mobileEnvironment.apiBaseUrl);
    });
  });

  describe('4. Mobile Authentication Store', () => {
    let memoryStorage: MemoryStorageAdapter;
    let authStore: MobileAuthStore;

    beforeEach(() => {
      memoryStorage = new MemoryStorageAdapter();
      authStore = new MobileAuthStore(memoryStorage);
    });

    it('should initialize with initializing or unauthenticated status', async () => {
      expect(authStore.getState().status).toBe('initializing');
      await authStore.initialize();
      expect(authStore.getState().status).toBe('unauthenticated');
    });

    it('should manage login, logout, and token restoration', async () => {
      const testUser: MobileUser = {
        id: 'usr_1',
        email: 'customer@dbc.com',
        name: 'Jane Customer',
        role: 'customer',
      };

      await authStore.setSession(testUser, 'test_access_token');
      const state = authStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(testUser);

      // Verify profile saved in storage
      const storedProfile = await memoryStorage.getItem('user_profile');
      expect(storedProfile).toContain('customer@dbc.com');

      // Test Logout
      await authStore.logout();
      expect(authStore.getState().status).toBe('unauthenticated');
      expect(authStore.getState().user).toBeNull();
      expect(await memoryStorage.getItem('user_profile')).toBeNull();
    });

    it('should handle session expiration state', () => {
      authStore.markExpired();
      expect(authStore.getState().status).toBe('expired');
      expect(authStore.getState().error).toContain('Session expired');
    });
  });

  describe('5. Mobile Design System Theme Tokens', () => {
    it('should define primary color palette and typography scale', () => {
      expect(mobileTheme.colors.primary).toBe('#2563EB');
      expect(mobileTheme.colors.background).toBe('#F8FAFC');
      expect(mobileTheme.typography.fontSize.md).toBe(16);
      expect(mobileTheme.typography.fontWeight.semibold).toBe('600');
    });

    it('should enforce minimum touch target sizes for mobile accessibility', () => {
      expect(mobileTheme.touchTargets.minTouchArea).toBeGreaterThanOrEqual(44);
      expect(mobileTheme.touchTargets.buttonHeight).toBeGreaterThanOrEqual(44);
      expect(mobileTheme.touchTargets.inputHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('6. Native Platform Capability Adapters', () => {
    it('should provide default fallback adapters for camera, files, notifications, biometrics, deep link', async () => {
      expect(await platformAdapters.camera.takePhoto()).toBeNull();
      expect(await platformAdapters.filePicker.pickDocument()).toBeNull();
      expect(await platformAdapters.notification.requestPermission()).toBe(false);
      expect(await platformAdapters.biometric.isSupported()).toBe(false);
      expect(platformAdapters.deepLink.onUrlOpened(() => {})).toBeDefined();
    });
  });

  describe('7. Mobile Navigation Foundation', () => {
    it('should determine initial navigation stack based on user role', () => {
      expect(determineInitialNavigationStack({ status: 'unauthenticated', user: null, error: null })).toBe('Public');

      const customerUser: MobileUser = { id: '1', email: 'c@dbc.com', name: 'Cust', role: 'customer' };
      expect(determineInitialNavigationStack({ status: 'authenticated', user: customerUser, error: null })).toBe('CustomerTab');

      const contractorUser: MobileUser = { id: '2', email: 'pro@dbc.com', name: 'Pro', role: 'contractor' };
      expect(determineInitialNavigationStack({ status: 'authenticated', user: contractorUser, error: null })).toBe('ProfessionalTab');
    });

    it('should configure Customer and Professional tab stacks', () => {
      expect(mobileNavigationRoutes.customerTabs.length).toBe(5);
      expect(mobileNavigationRoutes.professionalTabs.length).toBe(5);

      const customerTabNames = mobileNavigationRoutes.customerTabs.map((t) => t.route);
      expect(customerTabNames).toContain('Overview');
      expect(customerTabNames).toContain('MyProjects');
      expect(customerTabNames).toContain('Quotations');

      const professionalTabNames = mobileNavigationRoutes.professionalTabs.map((t) => t.route);
      expect(professionalTabNames).toContain('Dashboard');
      expect(professionalTabNames).toContain('Leads');
      expect(professionalTabNames).toContain('ActiveProjects');
    });
  });

  describe('8. Base Component Specifications', () => {
    it('should define UI primitive specifications with theme tokens', () => {
      expect(mobileBaseComponents.PrimaryButton.minHeight).toBe(mobileTheme.touchTargets.buttonHeight);
      expect(mobileBaseComponents.ScreenContainer.backgroundColor).toBe(mobileTheme.colors.background);
      expect(mobileBaseComponents.TextInput.borderColor).toBe(mobileTheme.colors.border);
    });
  });

  describe('9. Documentation Verification', () => {
    it('should have MOBILE_IMPLEMENTATION_STATUS.md documentation file in repository', () => {
      const docPath = path.resolve(__dirname, '../../documentation/MOBILE_IMPLEMENTATION_STATUS.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf8');
      expect(content).toContain('DBC Native Mobile Implementation Status');
      expect(content).toContain('ADR-001');
      expect(content).toContain('StorageAdapter.ts');
      expect(content).toContain('mobileApiClient.ts');
      expect(content).toContain('authStore.ts');
      expect(content).toContain('themeTokens.ts');
    });
  });
});
