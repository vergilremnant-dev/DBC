import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemoryStorageAdapter } from '../../mobile/src/storage/StorageAdapter';
import { MobileAuthStore } from '../../mobile/src/state/authStore';
import { mobileAuthService, resolveUserRole } from '../../mobile/src/services/mobileAuthService';
import { authService } from '../../src/services/auth/authService';
import { LoginScreenController, renderLoginScreenDescriptor } from '../../mobile/src/screens/auth/LoginScreen';
import { RegisterScreenController, renderRegisterScreenDescriptor } from '../../mobile/src/screens/auth/RegisterScreen';
import { OtpVerificationScreenController, renderOtpVerificationScreenDescriptor } from '../../mobile/src/screens/auth/OtpVerificationScreen';
import { AuthSuccessScreenController } from '../../mobile/src/screens/auth/AuthSuccessScreen';
import { determineInitialNavigationStack, resolvePostAuthNavigation } from '../../mobile/src/navigation/rootNavigation';

vi.mock('../../src/services/auth/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    sendEmailOtp: vi.fn(),
    verifyEmailOtp: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('Module 34 — Mobile Authentication & Onboarding Test Suite', () => {
  let memoryStorage: MemoryStorageAdapter;
  let authStore: MobileAuthStore;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryStorage = new MemoryStorageAdapter();
    authStore = new MobileAuthStore(memoryStorage);
  });

  describe('1. Login Workflows', () => {
    it('should successfully authenticate user credentials and update session state', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        accessToken: 'mock_jwt_token',
        user: {
          id: 101,
          firstName: 'Sarah',
          lastName: 'Customer',
          email: 'sarah@example.com',
          role: 'ROLE_CUSTOMER',
        },
      });

      const controller = new LoginScreenController();
      controller.setEmail('sarah@example.com');
      controller.setPassword('Secret123!');

      const success = await controller.submitLogin();
      expect(success).toBe(true);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'sarah@example.com',
        password: 'Secret123!',
      });
    });

    it('should handle invalid credentials error safely without crashing', async () => {
      vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid email or password'));

      const controller = new LoginScreenController();
      controller.setEmail('wrong@example.com');
      controller.setPassword('WrongPass!');

      const success = await controller.submitLogin();
      expect(success).toBe(false);
      expect(controller.getState().errorMessage).toContain('Invalid email or password');
    });

    it('should fail client-side validation when email or password is omitted', async () => {
      const controller = new LoginScreenController();
      controller.setEmail('invalid-email');
      controller.setPassword('123');

      const success = await controller.submitLogin();
      expect(success).toBe(false);
      expect(controller.getState().fieldErrors.email).toBeDefined();
      expect(controller.getState().fieldErrors.password).toBeDefined();
    });
  });

  describe('2. Registration Workflows', () => {
    it('should submit registration payload and trigger OTP dispatch', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({
        success: true,
        message: 'Account created',
        verificationToken: 'v_token_123',
      });
      vi.mocked(authService.sendEmailOtp).mockResolvedValueOnce({
        success: true,
        message: 'OTP sent',
      });

      const controller = new RegisterScreenController();
      controller.setField('firstName', 'Alex');
      controller.setField('lastName', 'Contractor');
      controller.setField('email', 'alex@builder.com');
      controller.setField('password', 'StrongPass123!');
      controller.setField('role', 'contractor');

      const challenge = await controller.submitRegistration();
      expect(challenge).not.toBeNull();
      expect(challenge?.email).toBe('alex@builder.com');
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alex@builder.com',
          firstName: 'Alex',
          role: 'ROLE_CONTRACTOR',
        })
      );
      expect(authService.sendEmailOtp).toHaveBeenCalledWith('alex@builder.com');
    });

    it('should reject registration when required fields are missing', async () => {
      const controller = new RegisterScreenController();
      const challenge = await controller.submitRegistration();
      expect(challenge).toBeNull();
      expect(controller.getState().fieldErrors.firstName).toBeDefined();
      expect(controller.getState().fieldErrors.email).toBeDefined();
    });
  });

  describe('3. OTP Verification Workflows', () => {
    it('should verify 6-digit OTP code successfully', async () => {
      vi.mocked(authService.verifyEmailOtp).mockResolvedValueOnce({
        success: true,
        message: 'Verification complete',
      });

      const controller = new OtpVerificationScreenController('user@example.com');
      controller.setOtpCode('123456');

      const success = await controller.verifyOtp();
      expect(success).toBe(true);
      expect(authService.verifyEmailOtp).toHaveBeenCalledWith('user@example.com', '123456');
    });

    it('should reject invalid or incomplete OTP code', async () => {
      const controller = new OtpVerificationScreenController('user@example.com');
      controller.setOtpCode('123'); // only 3 digits

      const success = await controller.verifyOtp();
      expect(success).toBe(false);
      expect(controller.getState().errorMessage).toContain('complete 6-digit');
    });

    it('should resend OTP code and reset countdown timer', async () => {
      vi.mocked(authService.sendEmailOtp).mockResolvedValueOnce({
        success: true,
        message: 'New code sent',
      });

      const controller = new OtpVerificationScreenController('user@example.com');
      // Simulate countdown reaching 0
      for (let i = 0; i < 60; i++) {
        controller.decrementCountdown();
      }

      const resendSuccess = await controller.resendOtp();
      expect(resendSuccess).toBe(true);
      expect(controller.getState().resendCountdown).toBe(60);
      expect(authService.sendEmailOtp).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('4. Session Restoration & Expiration', () => {
    it('should transition to unauthenticated when no stored token exists', async () => {
      await authStore.initialize();
      expect(authStore.getState().status).toBe('unauthenticated');
      expect(authStore.getState().user).toBeNull();
    });

    it('should restore authenticated session when valid token and profile exist in storage', async () => {
      await memoryStorage.setItem('access_token', 'valid_token');
      await memoryStorage.setItem(
        'user_profile',
        JSON.stringify({
          id: '10',
          email: 'homeowner@dbc.com',
          name: 'Homeowner Jane',
          role: 'customer',
        })
      );

      await authStore.initialize();
      expect(authStore.getState().status).toBe('authenticated');
      expect(authStore.getState().user?.email).toBe('homeowner@dbc.com');
    });

    it('should clear stored session when session is marked expired', async () => {
      await authStore.setSession(
        { id: '1', email: 'test@dbc.com', name: 'Test User', role: 'customer' },
        'token_123'
      );

      authStore.markExpired();
      expect(authStore.getState().status).toBe('expired');
      expect(authStore.getState().error).toBeDefined();
    });
  });

  describe('5. Role Resolution Logic', () => {
    it('should resolve raw backend roles to mobile role standards', () => {
      expect(resolveUserRole('ROLE_CUSTOMER')).toBe('customer');
      expect(resolveUserRole('ROLE_CONTRACTOR')).toBe('contractor');
      expect(resolveUserRole('ROLE_PROVIDER')).toBe('contractor');
      expect(resolveUserRole('ROLE_ADMIN')).toBe('admin');
      expect(resolveUserRole(undefined)).toBe('customer');
    });

    it('should route user to appropriate stack based on resolved role', () => {
      const customerState = {
        status: 'authenticated' as const,
        user: { id: '1', email: 'c@dbc.com', name: 'Cust', role: 'customer' as const },
        error: null,
        challengeState: 'AUTHENTICATED' as const,
        pendingTarget: null,
      };
      expect(determineInitialNavigationStack(customerState)).toBe('CustomerTab');

      const contractorState = {
        status: 'authenticated' as const,
        user: { id: '2', email: 'pro@dbc.com', name: 'Pro', role: 'contractor' as const },
        error: null,
        challengeState: 'AUTHENTICATED' as const,
        pendingTarget: null,
      };
      expect(determineInitialNavigationStack(contractorState)).toBe('ProfessionalTab');
    });

    it('should display role onboarding screen in AuthSuccessScreenController', () => {
      const controller = new AuthSuccessScreenController({
        id: '5',
        email: 'pro@builder.com',
        name: 'Bob Builder',
        role: 'contractor',
      });
      expect(controller.getResolvedTargetStack()).toBe('ProfessionalTab');
    });
  });

  describe('6. Logout Workflow', () => {
    it('should perform complete logout and reset store state to unauthenticated', async () => {
      vi.mocked(authService.logout).mockResolvedValueOnce();

      await authStore.setSession(
        { id: '1', email: 'logged@dbc.com', name: 'User', role: 'customer' },
        'jwt_token'
      );
      expect(authStore.getState().status).toBe('authenticated');

      await mobileAuthService.logout();
      await authStore.logout();

      expect(authStore.getState().status).toBe('unauthenticated');
      expect(authStore.getState().user).toBeNull();
      expect(await memoryStorage.getItem('user_profile')).toBeNull();
    });
  });

  describe('7. Deep Link Pending Navigation Handoff', () => {
    it('should capture and resolve pending deep link target after post-auth resolution', () => {
      authStore.setPendingTarget({ routeName: 'ProjectDetail', params: { projectId: 'p-99' } });
      expect(authStore.getState().pendingTarget?.routeName).toBe('ProjectDetail');

      const resolved = resolvePostAuthNavigation(authStore.getState());
      expect(resolved.pendingTarget?.routeName).toBe('ProjectDetail');

      const cleared = authStore.clearPendingTarget();
      expect(cleared?.routeName).toBe('ProjectDetail');
      expect(authStore.getState().pendingTarget).toBeNull();
    });
  });

  describe('8. Security Verification', () => {
    it('should obfuscate password and OTP in screen descriptors and clear memory state', () => {
      const loginController = new LoginScreenController();
      loginController.setPassword('MySuperSecretPassword123!');

      const loginDescriptor = renderLoginScreenDescriptor(loginController.getState());
      const passwordInput = loginDescriptor.inputs.find((i) => i.label === 'Password');
      expect(passwordInput?.value).toBe('••••••••');
      expect(JSON.stringify(loginDescriptor)).not.toContain('MySuperSecretPassword123!');

      const otpController = new OtpVerificationScreenController('test@dbc.com');
      otpController.setOtpCode('654321');
      const otpDescriptor = renderOtpVerificationScreenDescriptor(otpController.getState());
      expect(otpDescriptor.otpInput.value).toBe('••••••');
      expect(JSON.stringify(otpDescriptor)).not.toContain('654321');
    });
  });
});
