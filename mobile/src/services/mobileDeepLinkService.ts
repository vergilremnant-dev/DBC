import { mobileAuthStore, AuthState } from '../state/authStore.js';
import type { RootStackParamList } from '../navigation/rootNavigation.js';
import type {
  MobileNotification,
  MobileNotificationTarget,
} from '../types/mobileNotificationTypes.js';

export interface DeepLinkResolutionResult {
  canNavigate: boolean;
  target?: MobileNotificationTarget;
  reason?: 'UNAUTHENTICATED' | 'UNAUTHORIZED_ROLE_MISMATCH' | 'RESOURCE_NOT_FOUND' | 'INVALID_URL';
  fallbackRoute?: keyof RootStackParamList;
  redirectedToAuth?: boolean;
}

export const mobileDeepLinkService = {
  resolveDeepLink(pathOrUrl: string, userRole?: string): MobileNotificationTarget {
    const normRole = (userRole || 'customer').toLowerCase();
    let cleanPath = pathOrUrl.trim();

    // Strip scheme / hostname if full URL (e.g. dbc://app/project/123 or https://dbc.in/project/123)
    if (cleanPath.includes('://')) {
      const parts = cleanPath.split('://')[1].split('/');
      parts.shift(); // remove hostname or app scheme root
      cleanPath = '/' + parts.join('/');
    }

    // Standardize leading slash
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    const segments = cleanPath.split('/').filter(Boolean);

    // 1. /project/:id/milestones/:milestoneId
    if (segments[0] === 'project' && segments[2] === 'milestones' && segments[3]) {
      if (normRole === 'contractor') {
        return {
          route: 'ProfessionalMilestoneDetails',
          params: { projectId: segments[1], milestoneId: segments[3] },
          urlPath: cleanPath,
          resourceType: 'milestone',
          resourceId: segments[3],
          allowedRoles: ['contractor'],
        };
      }
      return {
        route: 'CustomerMilestoneDetails',
        params: { projectId: segments[1], milestoneId: segments[3] },
        urlPath: cleanPath,
        resourceType: 'milestone',
        resourceId: segments[3],
        allowedRoles: ['customer'],
      };
    }

    // 2. /project/:id/financials
    if (segments[0] === 'project' && segments[2] === 'financials') {
      if (normRole === 'contractor') {
        return {
          route: 'ProfessionalProjectFinancials',
          params: { projectId: segments[1] },
          urlPath: cleanPath,
          resourceType: 'financials',
          resourceId: segments[1],
          allowedRoles: ['contractor'],
        };
      }
      return {
        route: 'CustomerProjectFinancials',
        params: { projectId: segments[1] },
        urlPath: cleanPath,
        resourceType: 'financials',
        resourceId: segments[1],
        allowedRoles: ['customer'],
      };
    }

    // 3. /project/:id
    if (segments[0] === 'project' && segments[1]) {
      if (normRole === 'contractor') {
        return {
          route: 'ProfessionalProjectWorkspace',
          params: { projectId: segments[1] },
          urlPath: cleanPath,
          resourceType: 'project',
          resourceId: segments[1],
          allowedRoles: ['contractor'],
        };
      } else if (normRole === 'admin') {
        return {
          route: 'AdminProjects',
          params: { status: 'ALL' },
          urlPath: cleanPath,
          resourceType: 'project',
          resourceId: segments[1],
          allowedRoles: ['admin'],
        };
      }
      return {
        route: 'CustomerProjectWorkspace',
        params: { projectId: segments[1] },
        urlPath: cleanPath,
        resourceType: 'project',
        resourceId: segments[1],
        allowedRoles: ['customer'],
      };
    }

    // 4. /request/:id
    if (segments[0] === 'request' && segments[1]) {
      if (normRole === 'contractor') {
        return {
          route: 'ProfessionalRequestDetails',
          params: { requestId: segments[1] },
          urlPath: cleanPath,
          resourceType: 'request',
          resourceId: segments[1],
          allowedRoles: ['contractor'],
        };
      }
      return {
        route: 'ProjectRequestDetails',
        params: { requestId: segments[1] },
        urlPath: cleanPath,
        resourceType: 'request',
        resourceId: segments[1],
        allowedRoles: ['customer'],
      };
    }

    // 5. /quotation/:id
    if (segments[0] === 'quotation' && segments[1]) {
      const qId = parseInt(segments[1], 10) || 101;
      if (normRole === 'contractor') {
        return {
          route: 'ProfessionalQuotationDetails',
          params: { quotationId: qId },
          urlPath: cleanPath,
          resourceType: 'quotation',
          resourceId: String(qId),
          allowedRoles: ['contractor'],
        };
      }
      return {
        route: 'QuotationDetails',
        params: { quotationId: qId },
        urlPath: cleanPath,
        resourceType: 'quotation',
        resourceId: String(qId),
        allowedRoles: ['customer'],
      };
    }

    // 6. /messages/:threadId
    if ((segments[0] === 'messages' || segments[0] === 'inbox') && segments[1]) {
      return {
        route: 'CustomerConversation',
        params: { threadId: segments[1] },
        urlPath: cleanPath,
        resourceType: 'message',
        resourceId: segments[1],
        allowedRoles: ['customer', 'contractor'],
      };
    }

    // 7. /admin/users/:userId
    if (segments[0] === 'admin' && segments[1] === 'users' && segments[2]) {
      return {
        route: 'AdminUserDetails',
        params: { userId: segments[2] },
        urlPath: cleanPath,
        resourceType: 'user',
        resourceId: segments[2],
        allowedRoles: ['admin'],
      };
    }

    // 8. /admin/projects
    if (segments[0] === 'admin' && segments[1] === 'projects') {
      return {
        route: 'AdminProjects',
        urlPath: cleanPath,
        resourceType: 'project',
        allowedRoles: ['admin'],
      };
    }

    // Default Fallback
    const fallbackRoute: keyof RootStackParamList =
      normRole === 'contractor' ? 'ProfessionalHome' : normRole === 'admin' ? 'AdminHome' : 'CustomerHome';

    return {
      route: fallbackRoute,
      urlPath: cleanPath,
      allowedRoles: ['customer', 'contractor', 'admin'],
    };
  },

  resolveNotificationTarget(notification: MobileNotification, userRole?: string): MobileNotificationTarget {
    if (notification.target && notification.target.route) {
      // Re-evaluate target with userRole to ensure role safety
      const normRole = (userRole || 'customer').toLowerCase();

      if (notification.projectId) {
        return this.resolveDeepLink(`/project/${notification.projectId}`, normRole);
      }
      if (notification.requestId) {
        return this.resolveDeepLink(`/request/${notification.requestId}`, normRole);
      }
      if (notification.quotationId) {
        return this.resolveDeepLink(`/quotation/${notification.quotationId}`, normRole);
      }
      if (notification.threadId) {
        return this.resolveDeepLink(`/messages/${notification.threadId}`, normRole);
      }

      return notification.target;
    }

    return this.resolveDeepLink('/home', userRole);
  },

  evaluateTargetAccess(target: MobileNotificationTarget, authState: AuthState): DeepLinkResolutionResult {
    const isAuth = authState.status === 'authenticated' && !!authState.user;
    const userRole = (authState.user?.role || 'customer').toLowerCase();

    const defaultFallback: keyof RootStackParamList =
      userRole === 'contractor' ? 'ProfessionalHome' : userRole === 'admin' ? 'AdminHome' : 'CustomerHome';

    if (!isAuth) {
      mobileAuthStore.setPendingTarget({
        route: target.route,
        params: target.params,
        urlPath: target.urlPath,
      });

      return {
        canNavigate: false,
        reason: 'UNAUTHENTICATED',
        redirectedToAuth: true,
      };
    }

    if (target.allowedRoles && target.allowedRoles.length > 0) {
      const isRoleAllowed = target.allowedRoles.includes(userRole as any);

      if (!isRoleAllowed) {
        return {
          canNavigate: false,
          reason: 'UNAUTHORIZED_ROLE_MISMATCH',
          fallbackRoute: defaultFallback,
        };
      }
    }

    return {
      canNavigate: true,
      target,
    };
  },
};
