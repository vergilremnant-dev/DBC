/**
 * Mobile Auth Success & Role Resolution Onboarding Screen Component.
 * Displays role resolution progress and transitions to CustomerTab or ProfessionalTab.
 */

import { MobileUser } from '../../state/authStore';
import { mobileTheme } from '../../theme/themeTokens';

export interface AuthSuccessScreenState {
  user: MobileUser;
  targetStack: 'CustomerTab' | 'ProfessionalTab' | 'Public';
  isResolvingRole: boolean;
}

export class AuthSuccessScreenController {
  private state: AuthSuccessScreenState;

  constructor(user: MobileUser) {
    let targetStack: 'CustomerTab' | 'ProfessionalTab' | 'Public' = 'CustomerTab';
    if (user.role === 'contractor') {
      targetStack = 'ProfessionalTab';
    } else if (user.role === 'customer' || user.role === 'admin') {
      targetStack = 'CustomerTab';
    }

    this.state = {
      user,
      targetStack,
      isResolvingRole: false,
    };
  }

  getState(): AuthSuccessScreenState {
    return { ...this.state };
  }

  getResolvedTargetStack(): 'CustomerTab' | 'ProfessionalTab' | 'Public' {
    return this.state.targetStack;
  }
}

export const renderAuthSuccessScreenDescriptor = (state: AuthSuccessScreenState) => ({
  type: 'Screen',
  name: 'AuthSuccessScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    greeting: `Welcome, ${state.user.name}!`,
    subtitle: state.user.role === 'contractor'
      ? 'Setting up your Professional Contractor workspace...'
      : 'Setting up your Customer project workspace...',
    roleBadge: state.user.role.toUpperCase(),
    icon: state.user.role === 'contractor' ? 'hammer' : 'home',
  },
  loader: {
    active: true,
    color: mobileTheme.colors.primary,
  },
});
