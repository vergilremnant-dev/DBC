/**
 * Base UI Components for DBC Mobile Application.
 * Reusable foundation primitives for screens, forms, buttons, loading, error states,
 * modal dialogs, status badges, and accessibility/i18n attributes.
 */

import { mobileTheme } from '../theme/themeTokens';
import { AccessibleControlProps } from '../accessibility/accessibilityTypes';
import { getAccessibleProps, getStatusAccessibilityInfo } from '../accessibility/accessibilityUtils';

export interface BaseComponentProps extends AccessibleControlProps {
  testID?: string;
  className?: string;
  id?: string;
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
  minHeight?: number;
  minWidth?: number;
}

export interface TextInputProps extends BaseComponentProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}

export interface LoadingViewProps extends BaseComponentProps {
  message?: string;
}

export interface ErrorViewProps extends BaseComponentProps {
  message: string;
  onRetry?: () => void;
}

export interface ModalDialogProps extends BaseComponentProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children?: unknown;
}

export interface StatusBadgeProps extends BaseComponentProps {
  status: string;
}

/**
 * Mobile Component Descriptor definitions for foundation & accessibility verification.
 */
export const mobileBaseComponents = {
  ScreenContainer: {
    name: 'ScreenContainer',
    minHeight: '100%',
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.md,
    role: 'region' as const,
  },
  PrimaryButton: {
    name: 'PrimaryButton',
    minHeight: mobileTheme.touchTargets.buttonHeight, // 48px
    minWidth: mobileTheme.touchTargets.minTouchArea, // 44px
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.borderRadius.md,
    role: 'button' as const,
    getProps: (props: PrimaryButtonProps) => ({
      ...getAccessibleProps({
        role: 'button',
        ariaLabel: props.ariaLabel || props.label,
        ariaBusy: props.loading,
        accessibilityState: {
          disabled: props.disabled || props.loading,
          busy: props.loading,
        },
        ...props,
      }),
    }),
  },
  TextInput: {
    name: 'TextInput',
    minHeight: mobileTheme.touchTargets.inputHeight, // 48px
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.borderRadius.sm,
    paddingHorizontal: mobileTheme.spacing.md,
    role: 'textbox' as const,
    getProps: (props: TextInputProps) => ({
      ...getAccessibleProps({
        role: 'textbox',
        ariaLabel: props.ariaLabel || props.label,
        ariaInvalid: Boolean(props.error),
        ariaRequired: props.required,
        ariaDescribedBy: props.error ? `${props.testID || 'input'}-error` : props.ariaDescribedBy,
        accessibilityState: {
          invalid: Boolean(props.error),
        },
        ...props,
      }),
    }),
  },
  LoadingView: {
    name: 'LoadingView',
    color: mobileTheme.colors.primary,
    role: 'status' as const,
    getProps: (props: LoadingViewProps) => ({
      ...getAccessibleProps({
        role: 'status',
        ariaLive: 'polite',
        ariaBusy: true,
        ariaLabel: props.message || 'Loading content...',
        ...props,
      }),
    }),
  },
  ErrorView: {
    name: 'ErrorView',
    color: mobileTheme.colors.error,
    role: 'alert' as const,
    getProps: (props: ErrorViewProps) => ({
      ...getAccessibleProps({
        role: 'alert',
        ariaLive: 'assertive',
        ariaLabel: props.message,
        ...props,
      }),
    }),
  },
  ModalDialog: {
    name: 'ModalDialog',
    role: 'dialog' as const,
    ariaModal: true,
    getProps: (props: ModalDialogProps) => ({
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': `${props.testID || 'modal'}-title`,
      'aria-label': props.title,
    }),
  },
  StatusBadge: {
    name: 'StatusBadge',
    role: 'status' as const,
    getProps: (props: StatusBadgeProps) => {
      const info = getStatusAccessibilityInfo(props.status);
      return {
        role: 'status',
        'aria-label': info.accessibilityLabel,
        color: info.color,
        symbol: info.symbol,
        displayText: info.displayText,
      };
    },
  },
};
