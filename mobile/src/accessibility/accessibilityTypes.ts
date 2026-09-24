/**
 * Accessibility (a11y) Types & Interfaces for DBC Mobile Application.
 * Standardized types for ARIA attributes, focus management, status indicators,
 * touch targets, text scaling, and reduced motion.
 */

export type AccessibilityRole =
  | 'button'
  | 'link'
  | 'checkbox'
  | 'radio'
  | 'textbox'
  | 'searchbox'
  | 'dialog'
  | 'alert'
  | 'status'
  | 'progressbar'
  | 'tab'
  | 'tablist'
  | 'heading'
  | 'img'
  | 'navigation'
  | 'form'
  | 'region';

export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

export interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  expanded?: boolean;
  invalid?: boolean;
}

export interface AccessibleControlProps {
  role?: AccessibilityRole;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  ariaLive?: LiveRegionPoliteness;
  ariaBusy?: boolean;
  ariaInvalid?: boolean;
  ariaRequired?: boolean;
  accessibilityState?: AccessibilityState;
}

export interface StatusAccessibilityInfo {
  code: string;
  displayText: string;
  symbol: string;
  accessibilityLabel: string;
  color: string;
}

export interface FocusOptions {
  autoFocus?: boolean;
  preventScroll?: boolean;
  trapFocus?: boolean;
  returnFocusId?: string;
}

export interface ReducedMotionConfig {
  enabled: boolean;
  durationMultiplier: number;
}

export interface TextScaleConfig {
  scaleFactor: number; // e.g., 1.0 (default), 1.25, 1.5, 2.0
  maxScaleFactor: number; // Max safe scale factor before wrapping rules apply
}
