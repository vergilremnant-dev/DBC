/**
 * DBC Mobile Design System Theme Tokens.
 * Unified design tokens for colors, typography, spacing, touch targets, shadows,
 * contrast standards, and accessibility support.
 */

export const mobileColors = {
  primary: '#2563EB', // Blue 600
  primaryHover: '#1D4ED8',
  primaryLight: '#EFF6FF',
  secondary: '#0F172A', // Slate 900
  accent: '#F59E0B', // Amber 500
  success: '#10B981', // Emerald 500
  warning: '#F59E0B',
  error: '#EF4444', // Red 500
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9', // Slate 100
  border: '#E2E8F0', // Slate 200
  textPrimary: '#0F172A',
  textSecondary: '#64748B', // Slate 500
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',
};

export const mobileTypography = {
  fontFamily: 'System',
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 30,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const mobileSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const mobileBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const mobileTouchTargets = {
  minTouchArea: 44, // 44px minimum touch target size per Mobile UX Guidelines
  buttonHeight: 48,
  inputHeight: 48,
};

export const mobileShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const mobileAccessibilityTokens = {
  minContrastRatio: 4.5, // WCAG AA for normal text
  largeTextMinContrastRatio: 3.0, // WCAG AA for large text
  reducedMotionDuration: 0, // ms when reduced motion enabled
  normalAnimationDuration: 200, // ms standard transition
  focusOutlineWidth: 2, // px outline for keyboard focus indicator
  focusOutlineColor: '#2563EB',
};

export const mobileTheme = {
  colors: mobileColors,
  typography: mobileTypography,
  spacing: mobileSpacing,
  borderRadius: mobileBorderRadius,
  touchTargets: mobileTouchTargets,
  shadows: mobileShadows,
  accessibility: mobileAccessibilityTokens,
};
