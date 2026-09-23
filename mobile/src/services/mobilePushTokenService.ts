import type { MobilePushTokenRegistration } from '../types/mobileNotificationTypes.js';

export interface PushProviderAdapter {
  registerToken(userId: string, role: string): Promise<MobilePushTokenRegistration>;
  unregisterToken(userId: string): Promise<void>;
  onTokenRefresh(callback: (token: string) => void): void;
}

class DeferredPushProviderAdapter implements PushProviderAdapter {
  private refreshCallbacks: Array<(token: string) => void> = [];

  async registerToken(userId: string, role: string): Promise<MobilePushTokenRegistration> {
    // Deferred implementation until FCM/APNs SDK is linked in native builds
    return {
      userId,
      token: `deferred_push_token_${userId}_${role}`,
      platform: 'web',
      provider: 'DEFERRED_WEB',
      updatedAt: new Date().toISOString(),
    };
  }

  async unregisterToken(userId: string): Promise<void> {
    // Deferred unregistration boundary
    return Promise.resolve();
  }

  onTokenRefresh(callback: (token: string) => void): void {
    this.refreshCallbacks.push(callback);
  }
}

let activeAdapter: PushProviderAdapter = new DeferredPushProviderAdapter();

export const mobilePushTokenService = {
  setAdapter(adapter: PushProviderAdapter): void {
    activeAdapter = adapter;
  },

  async registerPushToken(userId: string, role: string): Promise<MobilePushTokenRegistration> {
    try {
      return await activeAdapter.registerToken(userId, role);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Push token registration failed');
    }
  },

  async unregisterPushToken(userId: string): Promise<void> {
    try {
      await activeAdapter.unregisterToken(userId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Push token unregistration failed');
    }
  },

  onTokenRefresh(callback: (token: string) => void): void {
    activeAdapter.onTokenRefresh(callback);
  },
};
