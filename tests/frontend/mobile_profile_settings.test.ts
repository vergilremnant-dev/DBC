import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileProfileService } from '../../mobile/src/services/mobileProfileService.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import {
  MobileProfileScreenController,
  renderMobileProfileScreen,
} from '../../mobile/src/screens/profile/MobileProfileScreen.js';
import {
  EditProfileScreenController,
  renderEditProfileScreen,
} from '../../mobile/src/screens/profile/EditProfileScreen.js';
import {
  AccountSettingsScreenController,
  renderAccountSettingsScreen,
} from '../../mobile/src/screens/profile/AccountSettingsScreen.js';
import {
  SecuritySettingsScreenController,
  renderSecuritySettingsScreen,
} from '../../mobile/src/screens/profile/SecuritySettingsScreen.js';
import {
  NotificationPreferencesScreenController,
  renderNotificationPreferencesScreen,
} from '../../mobile/src/screens/profile/NotificationPreferencesScreen.js';
import { profileService } from '../../src/services/profile/profileService.js';

vi.mock('../../src/services/profile/profileService.js', () => ({
  profileService: {
    getProfile: vi.fn(),
    upsertProfile: vi.fn(),
    uploadImage: vi.fn(),
    getCompletion: vi.fn(),
  },
}));

describe('Module 47 — Mobile Profile, Settings & Account Management', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mobileProfileService.clearCache();
    await mobileAuthStore.setSession(
      {
        id: 'u-101',
        email: 'ramesh.kumar@example.com',
        name: 'Ramesh Kumar',
        role: 'customer',
      },
      'test_token_123'
    );
  });

  describe('1. Mobile Profile Service Capabilities', () => {
    it('fetches current user profile mapped to role-aware MobileUserProfile model', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({
        firstName: 'Ramesh',
        lastName: 'Kumar',
        phone: '+91 98765 43210',
        city: 'Hyderabad',
        address: 'Jubilee Hills, Road No. 36',
      });

      const profile = await mobileProfileService.getCurrentProfile();
      expect(profile.id).toBe('u-101');
      expect(profile.name).toBe('Ramesh Kumar');
      expect(profile.email).toBe('ramesh.kumar@example.com');
      expect(profile.role).toBe('customer');
      expect(profile.city).toBe('Hyderabad');
    });

    it('updates editable profile fields and syncs authStore user session', async () => {
      vi.mocked(profileService.upsertProfile).mockResolvedValue({ success: true });

      const updated = await mobileProfileService.updateProfile({
        firstName: 'Ramesh',
        lastName: 'Chandra',
        city: 'Bengaluru',
      });

      expect(updated.name).toBe('Ramesh Chandra');
      expect(updated.city).toBe('Bengaluru');

      const currentAuthUser = mobileAuthStore.getState().user;
      expect(currentAuthUser?.name).toBe('Ramesh Chandra');
    });

    it('uploads profile avatar image', async () => {
      vi.mocked(profileService.uploadImage).mockResolvedValue({
        url: 'https://example.com/avatars/user-101.jpg',
      });

      const res = await mobileProfileService.uploadProfileImage('base64_img_data');
      expect(res.url).toBe('https://example.com/avatars/user-101.jpg');
    });

    it('fetches account, security and notification settings', async () => {
      const accountSettings = await mobileProfileService.getAccountSettings();
      expect(accountSettings.email).toBe('ramesh.kumar@example.com');
      expect(accountSettings.securityModel).toBe('OTP_VERIFIED');

      const securitySettings = await mobileProfileService.getSecuritySettings();
      expect(securitySettings.authMethod).toBe('OTP_VERIFICATION');

      const prefs = await mobileProfileService.getNotificationPreferences();
      expect(prefs.projectUpdates).toBe(true);

      const updatedPrefs = await mobileProfileService.updateNotificationPreferences({ projectUpdates: false });
      expect(updatedPrefs.projectUpdates).toBe(false);
    });

    it('executes complete session logout and clears active auth state', async () => {
      await mobileProfileService.logout();

      const authState = mobileAuthStore.getState();
      expect(authState.status).toBe('unauthenticated');
      expect(authState.user).toBeNull();
    });
  });

  describe('2. Mobile Profile Screen Controllers & HTML Renderers', () => {
    it('initializes and renders MobileProfileScreen for Customer role', async () => {
      const controller = new MobileProfileScreenController({ userRole: 'customer' });
      await controller.init();

      const html = renderMobileProfileScreen(controller);
      expect(html).toContain('Account Profile');
      expect(html).toContain('Ramesh Kumar');
      expect(html).toContain('My Requests');
      expect(html).toContain('My Projects');
      expect(html).toContain('Sign Out of Account');
    });

    it('renders MobileProfileScreen for Professional role with commercial links', async () => {
      await mobileAuthStore.setSession(
        {
          id: 'u-202',
          email: 'venkatesh@apexcivil.in',
          name: 'Venkatesh Rao',
          role: 'contractor',
        },
        'contractor_token'
      );

      const controller = new MobileProfileScreenController({ userRole: 'contractor' });
      await controller.init();

      const html = renderMobileProfileScreen(controller);
      expect(html).toContain('Venkatesh Rao');
      expect(html).toContain('Trade Business');
      expect(html).toContain('Proposals & Quotes');
      expect(html).toContain('Finance & Earnings');
    });

    it('renders MobileProfileScreen for Admin role with platform oversight links', async () => {
      await mobileAuthStore.setSession(
        {
          id: 'u-admin',
          email: 'admin@dbc.in',
          name: 'Super Admin',
          role: 'admin',
        },
        'admin_token'
      );

      const controller = new MobileProfileScreenController({ userRole: 'admin' });
      await controller.init();

      const html = renderMobileProfileScreen(controller);
      expect(html).toContain('Super Admin');
      expect(html).toContain('Platform Users');
      expect(html).toContain('Trade Partners');
      expect(html).toContain('Operational Console');
    });

    it('handles logout confirmation modal triggers', async () => {
      const controller = new MobileProfileScreenController({ userRole: 'customer' });
      await controller.init();

      let html = renderMobileProfileScreen(controller);
      expect(html).not.toContain('Confirm Sign Out');

      controller.promptLogout();
      html = renderMobileProfileScreen(controller);
      expect(html).toContain('Confirm Sign Out');

      controller.closeLogoutModal();
      html = renderMobileProfileScreen(controller);
      expect(html).not.toContain('Confirm Sign Out');
    });

    it('initializes and renders EditProfileScreen with unsaved changes modal guard', async () => {
      const controller = new EditProfileScreenController({});
      await controller.init();

      let html = renderEditProfileScreen(controller);
      expect(html).toContain('Edit Profile');
      expect(html).toContain('First Name');
      expect(html).toContain('🔒 Email address change requires dedicated verification');

      controller.updateFormField('firstName', 'Ramesh Edit');
      const canLeaveDirectly = controller.handleBackAttempt();
      expect(canLeaveDirectly).toBe(false);

      html = renderEditProfileScreen(controller);
      expect(html).toContain('Discard Unsaved Changes?');

      controller.confirmDiscard();
      html = renderEditProfileScreen(controller);
      expect(html).not.toContain('Discard Unsaved Changes?');
    });

    it('saves profile updates in EditProfileScreen', async () => {
      vi.mocked(profileService.upsertProfile).mockResolvedValue({ success: true });

      const controller = new EditProfileScreenController({});
      await controller.init();

      controller.updateFormField('city', 'Chennai');
      await controller.saveProfile();

      const html = renderEditProfileScreen(controller);
      expect(html).toContain('Profile information saved successfully');
    });

    it('initializes and renders AccountSettingsScreen', async () => {
      const controller = new AccountSettingsScreenController({});
      await controller.init();

      const html = renderAccountSettingsScreen(controller);
      expect(html).toContain('Account Settings');
      expect(html).toContain('ramesh.kumar@example.com');
      expect(html).toContain('Quick Links');
    });

    it('initializes and renders SecuritySettingsScreen showcasing OTP verification model', async () => {
      const controller = new SecuritySettingsScreenController({});
      await controller.init();

      const html = renderSecuritySettingsScreen(controller);
      expect(html).toContain('Security & Verification');
      expect(html).toContain('Login & Verification Model');
      expect(html).toContain('OTP VERIFIED');
      expect(html).toContain('6-digit email OTP verification without passwords');
    });

    it('initializes and renders NotificationPreferencesScreen with toggle controls', async () => {
      const controller = new NotificationPreferencesScreenController({});
      await controller.init();

      let html = renderNotificationPreferencesScreen(controller);
      expect(html).toContain('Notification Preferences');
      expect(html).toContain('Project Updates');
      expect(html).toContain('Messages & Conversations');

      await controller.togglePreference('projectUpdates');
      html = renderNotificationPreferencesScreen(controller);
      expect(html).toContain('Notification preferences updated');
    });
  });
});
