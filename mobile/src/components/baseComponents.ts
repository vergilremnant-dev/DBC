/**
 * Base UI Components for DBC Mobile Application.
 * Reusable foundation primitives for screens, forms, buttons, loading, and error states.
 */

import { mobileTheme } from '../theme/themeTokens';

export interface BaseComponentProps {
  testID?: string;
  className?: string;
}

export interface ScreenContainerProps extends BaseComponentProps {
  title?: string;
  scrollable?: boolean;
  children?: unknown;
}

export interface PrimaryButtonProps extends BaseComponentProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface TextInputProps extends BaseComponentProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
}

export interface LoadingViewProps extends BaseComponentProps {
  message?: string;
}

export interface ErrorViewProps extends BaseComponentProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Mobile Component Descriptor definitions for foundation verification.
 */
export const mobileBaseComponents = {
  ScreenContainer: {
    name: 'ScreenContainer',
    minHeight: '100%',
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.md,
  },
  PrimaryButton: {
    name: 'PrimaryButton',
    minHeight: mobileTheme.touchTargets.buttonHeight,
    minWidth: mobileTheme.touchTargets.minTouchArea,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.borderRadius.md,
  },
  TextInput: {
    name: 'TextInput',
    minHeight: mobileTheme.touchTargets.inputHeight,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.borderRadius.sm,
    paddingHorizontal: mobileTheme.spacing.md,
  },
  LoadingView: {
    name: 'LoadingView',
    color: mobileTheme.colors.primary,
  },
  ErrorView: {
    name: 'ErrorView',
    color: mobileTheme.colors.error,
  },
};
