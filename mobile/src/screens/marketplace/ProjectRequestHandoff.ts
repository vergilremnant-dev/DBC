/**
 * Mobile Project Request Handoff Controller for DBC Mobile Application.
 * Preserves project request context (providerId, categoryId, city, budget, notes).
 * Handles authentication handoff when user is unauthenticated.
 */

import { mobileAuthStore, MobileAuthStore } from '../../state/authStore';
import { ProjectRequestContext } from '../../types/marketplaceMobileTypes';

export interface ProjectRequestHandoffResult {
  isAuthenticated: boolean;
  requestContext: ProjectRequestContext;
  nextRoute: 'ProjectRequestForm' | 'Login';
}

export class ProjectRequestHandoffController {
  private authStore: MobileAuthStore;

  constructor(authStore: MobileAuthStore = mobileAuthStore) {
    this.authStore = authStore;
  }

  /**
   * Initiates project request handoff. Preserves context and checks authentication.
   */
  initiateRequest(context: ProjectRequestContext, customStore?: MobileAuthStore): ProjectRequestHandoffResult {
    const store = customStore || this.authStore;
    const authState = store.getState();

    if (authState.status === 'authenticated' && authState.user) {
      return {
        isAuthenticated: true,
        requestContext: context,
        nextRoute: 'ProjectRequestForm',
      };
    }

    // Save pending request target in authStore for post-login restoration
    store.setPendingTarget({
      routeName: 'ProjectRequestForm',
      params: context as unknown as Record<string, unknown>,
    });

    return {
      isAuthenticated: false,
      requestContext: context,
      nextRoute: 'Login',
    };
  }

  /**
   * Restores pending project request context after authentication.
   */
  restorePendingRequestContext(customStore?: MobileAuthStore): ProjectRequestContext | null {
    const store = customStore || this.authStore;
    const pending = store.clearPendingTarget();
    if (pending && pending.routeName === 'ProjectRequestForm' && pending.params) {
      return pending.params as unknown as ProjectRequestContext;
    }
    return null;
  }
}

export const projectRequestHandoffController = new ProjectRequestHandoffController();
