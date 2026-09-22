/**
 * DBC Mobile Navigation Architecture Foundation.
 * Follows ADR-005: React Navigation for Role-Aware Mobile Routing.
 */

import { AuthState, MobileUser } from '../state/authStore';

export type PublicRoute = 'Landing' | 'Services' | 'Directory' | 'ArticleList' | 'ArticleDetail';
export type AuthRoute = 'Login' | 'Register' | 'ForgotPassword' | 'VerifyOTP';
export type CustomerTabRoute = 'Overview' | 'MyProjects' | 'Quotations' | 'Messages' | 'Profile';
export type ProfessionalTabRoute = 'Dashboard' | 'Leads' | 'ActiveProjects' | 'Milestones' | 'Profile';

export type RootStackParamList = {
  Public: { screen?: PublicRoute };
  Auth: { screen?: AuthRoute };
  CustomerTab: { screen?: CustomerTabRoute };
  ProfessionalTab: { screen?: ProfessionalTabRoute };
  ProjectDetail: { projectId: string };
  QuotationDetail: { quotationId: string };
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

export const mobileNavigationRoutes = {
  public: ['Landing', 'Services', 'Directory', 'ArticleList', 'ArticleDetail'] as PublicRoute[],
  auth: ['Login', 'Register', 'ForgotPassword', 'VerifyOTP'] as AuthRoute[],
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
