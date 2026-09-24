/**
 * Accessibility (a11y) Utilities for DBC Mobile Application.
 * Helper functions for focus management, color-independent status display,
 * touch target compliance, reduced motion detection, and text scaling.
 */

import {
  AccessibilityState,
  AccessibleControlProps,
  FocusOptions,
  ReducedMotionConfig,
  StatusAccessibilityInfo,
  TextScaleConfig,
} from './accessibilityTypes';
import { mobileColors, mobileTouchTargets } from '../theme/themeTokens';

/**
 * Generates accessible ARIA attribute mappings for web/PWA mobile components.
 */
export function getAccessibleProps(props: AccessibleControlProps) {
  const {
    role,
    ariaLabel,
    ariaDescribedBy,
    ariaLabelledBy,
    ariaLive,
    ariaBusy,
    ariaInvalid,
    ariaRequired,
    accessibilityState,
  } = props;

  return {
    role,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    'aria-live': ariaLive,
    'aria-busy': ariaBusy ? 'true' : undefined,
    'aria-invalid': ariaInvalid ? 'true' : undefined,
    'aria-required': ariaRequired ? 'true' : undefined,
    'aria-disabled': accessibilityState?.disabled ? 'true' : undefined,
    'aria-selected': accessibilityState?.selected ? 'true' : undefined,
    'aria-expanded': accessibilityState?.expanded ? 'true' : undefined,
    'aria-checked': accessibilityState?.checked !== undefined ? String(accessibilityState.checked) : undefined,
  };
}

/**
 * Status color + symbol + text accessible mapping matrix.
 * Ensures status is NEVER communicated through color alone.
 */
const STATUS_MAP: Record<string, { displayText: string; symbol: string; color: string }> = {
  // Request / Quotation Statuses
  REQUESTED: { displayText: 'Requested', symbol: '⏱', color: mobileColors.primary },
  PENDING: { displayText: 'Pending Review', symbol: '⏱', color: mobileColors.warning },
  ACCEPTED: { displayText: 'Accepted', symbol: '✓', color: mobileColors.success },
  REJECTED: { displayText: 'Rejected', symbol: '✕', color: mobileColors.error },
  CANCELLED: { displayText: 'Cancelled', symbol: '🚫', color: mobileColors.textMuted },
  EXPIRED: { displayText: 'Expired', symbol: '⌛', color: mobileColors.textMuted },

  // Project & Milestone Statuses
  DRAFT: { displayText: 'Draft', symbol: '✏', color: mobileColors.textSecondary },
  IN_PROGRESS: { displayText: 'In Progress', symbol: '🔄', color: mobileColors.primary },
  COMPLETED: { displayText: 'Completed', symbol: '✓', color: mobileColors.success },
  PAUSED: { displayText: 'Paused', symbol: '⏸', color: mobileColors.warning },
  DISPUTED: { displayText: 'Under Dispute', symbol: '⚠', color: mobileColors.error },

  // Payment Statuses
  UNPAID: { displayText: 'Unpaid', symbol: '⏳', color: mobileColors.warning },
  PAID: { displayText: 'Paid', symbol: '✓', color: mobileColors.success },
  REFUNDED: { displayText: 'Refunded', symbol: '↩', color: mobileColors.textSecondary },
  FAILED: { displayText: 'Failed', symbol: '✕', color: mobileColors.error },

  // Notification / Default
  UNREAD: { displayText: 'Unread', symbol: '●', color: mobileColors.primary },
  READ: { displayText: 'Read', symbol: '○', color: mobileColors.textMuted },
};

/**
 * Builds a color-independent status representation combining code, text, symbol, color, and screen reader label.
 */
export function getStatusAccessibilityInfo(statusCode: string): StatusAccessibilityInfo {
  const upperCode = (statusCode || '').toUpperCase();
  const entry = STATUS_MAP[upperCode] || {
    displayText: statusCode || 'Unknown',
    symbol: '•',
    color: mobileColors.textSecondary,
  };

  return {
    code: upperCode,
    displayText: entry.displayText,
    symbol: entry.symbol,
    accessibilityLabel: `Status: ${entry.displayText} (${entry.symbol})`,
    color: entry.color,
  };
}

/**
 * Validates touch target dimensions against mobile minimum touch guidelines (default 44px).
 */
export function validateTouchTarget(
  width?: number,
  height?: number,
  minTargetSize: number = mobileTouchTargets.minTouchArea
): { isValid: boolean; recommendedWidth: number; recommendedHeight: number } {
  const actualWidth = width ?? minTargetSize;
  const actualHeight = height ?? minTargetSize;
  const isValid = actualWidth >= minTargetSize && actualHeight >= minTargetSize;

  return {
    isValid,
    recommendedWidth: Math.max(actualWidth, minTargetSize),
    recommendedHeight: Math.max(actualHeight, minTargetSize),
  };
}

/**
 * Focus management helper for web / PWA mobile interfaces.
 */
export class FocusManager {
  private static activeFocusHistory: string[] = [];

  public static setFocus(elementId: string, options?: FocusOptions): boolean {
    if (typeof document === 'undefined') return false;
    const element = document.getElementById(elementId);
    if (element) {
      if (options?.returnFocusId && document.activeElement?.id) {
        this.activeFocusHistory.push(document.activeElement.id);
      }
      element.focus({ preventScroll: options?.preventScroll ?? false });
      return true;
    }
    return false;
  }

  public static restorePreviousFocus(): boolean {
    const previousId = this.activeFocusHistory.pop();
    if (previousId) {
      return this.setFocus(previousId, { preventScroll: true });
    }
    return false;
  }

  public static clearHistory(): void {
    this.activeFocusHistory = [];
  }
}

/**
 * Reduced Motion Utility.
 * Checks system preference for prefers-reduced-motion.
 */
export function getReducedMotionConfig(overrideEnabled?: boolean): ReducedMotionConfig {
  let prefersReduced = false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  const enabled = overrideEnabled ?? prefersReduced;
  return {
    enabled,
    durationMultiplier: enabled ? 0 : 1,
  };
}

/**
 * Dynamic Text Scale Calculation Utility.
 * Scales font sizes while respecting maximum bounds to prevent UI clipping.
 */
export function calculateScaledFontSize(
  baseSize: number,
  scaleFactor: number = 1.0,
  maxScaleFactor: number = 2.0
): number {
  const safeScale = Math.min(Math.max(scaleFactor, 0.8), maxScaleFactor);
  return Math.round(baseSize * safeScale);
}

/**
 * Converts physical directional styling properties to RTL logical property equivalents.
 */
export function getLogicalLayoutProperties(isRTL: boolean = false) {
  return {
    direction: isRTL ? ('rtl' as const) : ('ltr' as const),
    startMargin: isRTL ? 'marginRight' : 'marginLeft',
    endMargin: isRTL ? 'marginLeft' : 'marginRight',
    startPadding: isRTL ? 'paddingRight' : 'paddingLeft',
    endPadding: isRTL ? 'paddingLeft' : 'paddingRight',
    startPosition: isRTL ? 'right' : 'left',
    endPosition: isRTL ? 'left' : 'right',
  };
}
