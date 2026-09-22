/**
 * DBC Mobile Navigation Architecture Foundation.
 * Follows ADR-005: React Navigation for Role-Aware Mobile Routing.
 * Supports AuthStack routes, Marketplace public routes, Customer Workspace tabs, Project Execution screens, Deep Link pending targets, and Role Resolution.
 */

import { AuthState } from '../state/authStore';
import { PendingNavigationTarget } from '../types/authMobileTypes';

export type PublicRoute =
  | 'Landing'
  | 'Services'
  | 'Directory'
  | 'ArticleList'
  | 'ArticleDetail'
  | 'MarketplaceHome'
  | 'CategorySearch'
  | 'ProfessionalProfile';

export type AuthRoute = 'Login' | 'Register' | 'OtpVerification' | 'AuthSuccess' | 'ForgotPassword' | 'VerifyOTP';
export type CustomerTabRoute = 'Overview' | 'MyProjects' | 'Quotations' | 'Messages' | 'Profile' | 'CustomerHome' | 'CustomerRequests' | 'CustomerProjects';
export type ProfessionalTabRoute = 'Dashboard' | 'Leads' | 'ActiveProjects' | 'Milestones' | 'Profile';

export type RootStackParamList = {
  Public: { screen?: PublicRoute };
  Auth: { screen?: AuthRoute; email?: string };
  CustomerTab: { screen?: CustomerTabRoute };
  ProfessionalTab: { screen?: ProfessionalTabRoute };
  MarketplaceHome: undefined;
  CategorySearch: { categoryId?: number; categorySlug?: string; query?: string; city?: string };
  ProfessionalProfile: { providerId: string };
  ProjectAssistant: undefined;
  ProjectRequestForm: { providerId?: string; categoryId?: number; city?: string; notes?: string };
  ProjectRequestDetails: { requestId: string };
  QuotationDetails: { quotationId: number };
  CustomerHome: undefined;
  CustomerRequests: undefined;
  CustomerProjects: { status?: string };
  CustomerProjectWorkspace: { projectId: string };
  CustomerProjectOverview: { projectId: string };
  CustomerMilestones: { projectId: string };
  CustomerMilestoneDetails: { projectId: string; milestoneId: string };
  CustomerProjectTimeline: { projectId: string };
  CustomerProjectDocuments: { projectId: string };
  ProjectDetail: { projectId: string };
  ConsultationDetail: { consultationId: string };
};

export function determineInitialNavigationStack(authState: AuthState): 'Public' | 'Auth' | 'CustomerTab' | 'ProfessionalTab' {
  if (authState.status === 'initializing') {
    return 'Public';
  }

  if (authState.status !== 'authenticated' || !authState.user) {
    return 'Public';
  }

  const role = authState.user.role;
  if (role === 'contractor') {
    return 'ProfessionalTab';
  } else if (role === 'customer' || role === 'admin') {
    return 'CustomerTab';
  }

  return 'Public';
}

export function resolvePostAuthNavigation(
  authState: AuthState
): { targetStack: 'CustomerTab' | 'ProfessionalTab'; pendingTarget?: PendingNavigationTarget } {
  const defaultStack = authState.user?.role === 'contractor' ? 'ProfessionalTab' : 'CustomerTab';
  if (authState.pendingTarget) {
    return {
      targetStack: defaultStack,
      pendingTarget: authState.pendingTarget,
    };
  }
  return { targetStack: defaultStack };
}

export const mobileNavigationRoutes = {
  public: [
    'Landing',
    'Services',
    'Directory',
    'ArticleList',
    'ArticleDetail',
    'MarketplaceHome',
    'CategorySearch',
    'ProfessionalProfile',
  ] as PublicRoute[],
  auth: ['Login', 'Register', 'OtpVerification', 'AuthSuccess', 'ForgotPassword', 'VerifyOTP'] as AuthRoute[],
  customerTabs: [
    { route: 'Overview', label: 'Home', icon: 'home' },
    { route: 'MyProjects', label: 'Projects', icon: 'folder' },
    { route: 'Quotations', label: 'Quotes', icon: 'document-text' },
    { route: 'Messages', label: 'Chat', icon: 'chatbubbles' },
    { route: 'Profile', label: 'Profile', icon: 'person' },
  ],
  professionalTabs: [
    { route: 'Dashboard', label: 'Overview', icon: 'grid' },
    { route: 'Leads', label: 'Leads', icon: 'briefcase' },
    { route: 'ActiveProjects', label: 'Projects', icon: 'hammer' },
    { route: 'Milestones', label: 'Milestones', icon: 'checkbox' },
    { route: 'Profile', label: 'Profile', icon: 'person' },
  ],
};
