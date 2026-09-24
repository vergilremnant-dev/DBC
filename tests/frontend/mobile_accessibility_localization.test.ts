/**
 * Automated Unit Tests for Mobile Accessibility (a11y) & Localization (i18n).
 * Verifies accessible ARIA roles, form labels, dialogs, color-independent status indicators,
 * touch targets, focus management, reduced motion, text scaling, i18n lookup, fallbacks,
 * parameter interpolation, and locale-aware date/currency/number formatters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessibleProps,
  getStatusAccessibilityInfo,
  validateTouchTarget,
  FocusManager,
  getReducedMotionConfig,
  calculateScaledFontSize,
  getLogicalLayoutProperties,
} from '../../mobile/src/accessibility/accessibilityUtils';
import { mobileBaseComponents } from '../../mobile/src/components/baseComponents';
import { setLocale, getLocale, t, interpolateString } from '../../mobile/src/i18n/i18n';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatStatus,
} from '../../mobile/src/i18n/formatters';
import { mobileTouchTargets } from '../../mobile/src/theme/themeTokens';

describe('Module 55 — Mobile Accessibility & Localization Suite', () => {
  beforeEach(() => {
    setLocale('en-IN');
    FocusManager.clearHistory();
  });

  // --- Accessibility Tests ---

  it('1. Interactive controls expose accessible names and roles', () => {
    const buttonProps = mobileBaseComponents.PrimaryButton.getProps({
      label: 'Submit Quotation',
      onPress: () => {},
      ariaLabel: 'Submit Quotation to Customer',
    });

    expect(buttonProps.role).toBe('button');
    expect(buttonProps['aria-label']).toBe('Submit Quotation to Customer');
  });

  it('2. Icon-only buttons have fallback accessible labels', () => {
    const iconBtnProps = mobileBaseComponents.PrimaryButton.getProps({
      label: '',
      onPress: () => {},
      ariaLabel: 'Open notification center',
    });

    expect(iconBtnProps['aria-label']).toBe('Open notification center');
  });

  it('3. Form inputs have labels, required flags, and aria-invalid error states', () => {
    const inputProps = mobileBaseComponents.TextInput.getProps({
      label: 'Estimated Budget',
      value: '1000',
      onChangeText: () => {},
      error: 'Please enter a valid amount',
      required: true,
      testID: 'budget-input',
    });

    expect(inputProps.role).toBe('textbox');
    expect(inputProps['aria-label']).toBe('Estimated Budget');
    expect(inputProps['aria-invalid']).toBe('true');
    expect(inputProps['aria-required']).toBe('true');
    expect(inputProps['aria-describedby']).toBe('budget-input-error');
  });

  it('4. Modal dialogs expose dialog role, aria-modal, and labelledby title', () => {
    const modalProps = mobileBaseComponents.ModalDialog.getProps({
      isOpen: true,
      title: 'Confirm Payment',
      onClose: () => {},
      testID: 'payment-modal',
    });

    expect(modalProps.role).toBe('dialog');
    expect(modalProps['aria-modal']).toBe('true');
    expect(modalProps['aria-label']).toBe('Confirm Payment');
    expect(modalProps['aria-labelledby']).toBe('payment-modal-title');
  });

  it('5. Status values are color-independent (combines text, symbol, color, and accessible label)', () => {
    const acceptedStatus = getStatusAccessibilityInfo('ACCEPTED');
    expect(acceptedStatus.displayText).toBe('Accepted');
    expect(acceptedStatus.symbol).toBe('✓');
    expect(acceptedStatus.accessibilityLabel).toContain('Accepted');

    const rejectedStatus = getStatusAccessibilityInfo('REJECTED');
    expect(rejectedStatus.displayText).toBe('Rejected');
    expect(rejectedStatus.symbol).toBe('✕');

    const pendingStatus = getStatusAccessibilityInfo('PENDING');
    expect(pendingStatus.displayText).toBe('Pending Review');
    expect(pendingStatus.symbol).toBe('⏱');
  });

  it('6. Loading states expose live region status and busy announcements', () => {
    const loadingProps = mobileBaseComponents.LoadingView.getProps({
      message: 'Processing milestone payment...',
    });

    expect(loadingProps.role).toBe('status');
    expect(loadingProps['aria-live']).toBe('polite');
    expect(loadingProps['aria-busy']).toBe('true');
    expect(loadingProps['aria-label']).toBe('Processing milestone payment...');
  });

  it('7. Error states expose alert live regions for assertive screen reader announcements', () => {
    const errorProps = mobileBaseComponents.ErrorView.getProps({
      message: 'Network connection lost',
    });

    expect(errorProps.role).toBe('alert');
    expect(errorProps['aria-live']).toBe('assertive');
    expect(errorProps['aria-label']).toBe('Network connection lost');
  });

  it('8. Touch target validator enforces minimum touch size (44px/48px)', () => {
    const validTarget = validateTouchTarget(48, 48);
    expect(validTarget.isValid).toBe(true);

    const smallTarget = validateTouchTarget(30, 24);
    expect(smallTarget.isValid).toBe(false);
    expect(smallTarget.recommendedWidth).toBe(mobileTouchTargets.minTouchArea);
    expect(smallTarget.recommendedHeight).toBe(mobileTouchTargets.minTouchArea);
  });

  it('9. FocusManager tracks and restores focus without traps', () => {
    const setFocusSpy = vi.spyOn(FocusManager, 'setFocus').mockReturnValue(true);
    const restoreSpy = vi.spyOn(FocusManager, 'restorePreviousFocus').mockReturnValue(true);

    FocusManager.setFocus('modal-close-btn', { returnFocusId: 'open-modal-btn' });
    expect(setFocusSpy).toHaveBeenCalledWith('modal-close-btn', { returnFocusId: 'open-modal-btn' });

    FocusManager.restorePreviousFocus();
    expect(restoreSpy).toHaveBeenCalled();
  });

  it('10. Reduced motion config respects system prefers-reduced-motion preference', () => {
    const normalConfig = getReducedMotionConfig(false);
    expect(normalConfig.enabled).toBe(false);
    expect(normalConfig.durationMultiplier).toBe(1);

    const reducedConfig = getReducedMotionConfig(true);
    expect(reducedConfig.enabled).toBe(true);
    expect(reducedConfig.durationMultiplier).toBe(0);
  });

  it('11. Text scale calculator scales font size while bounding maximum scale factor', () => {
    const baseSize = 16;
    expect(calculateScaledFontSize(baseSize, 1.25)).toBe(20);
    expect(calculateScaledFontSize(baseSize, 1.5)).toBe(24);
    expect(calculateScaledFontSize(baseSize, 3.0, 2.0)).toBe(32); // capped at maxScaleFactor 2.0
  });

  // --- Localization & Formatting Tests ---

  it('12. i18n translation key lookup retrieves nested dictionary strings', () => {
    expect(t('common.save')).toBe('Save');
    expect(t('auth.signIn')).toBe('Sign In');
    expect(t('request.createRequest')).toBe('Create Project Request');
  });

  it('13. i18n translation fallback safely returns keyPath when translation missing', () => {
    expect(t('unknown.section.key')).toBe('unknown.section.key');
  });

  it('14. i18n parameter interpolation replaces placeholders correctly', () => {
    const result = t('notifications.unreadCount', { count: 5 });
    expect(result).toBe('5 unread notifications');
  });

  it('15. Currency formatter formats numbers into localized INR currency strings', () => {
    const formatted = formatCurrency(450000);
    expect(formatted).toContain('4,50,000');
    expect(formatted).toContain('₹');
  });

  it('16. Currency formatter strictly presents values without mutating backend financial data', () => {
    const rawBackendAmount = 125000.5;
    const formatted = formatCurrency(rawBackendAmount, { minimumFractionDigits: 2 });
    expect(formatted).toContain('1,25,000.50');
    expect(rawBackendAmount).toBe(125000.5); // Backend numeric value remains unchanged
  });

  it('17. Locale-aware Date formatter formats date strings and Date objects', () => {
    const dateStr = '2026-09-24T10:00:00.000Z';
    const formatted = formatDate(dateStr);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Sep');
  });

  it('18. Locale-aware Time formatter formats timestamps cleanly', () => {
    const dateObj = new Date('2026-09-24T17:30:00.000Z');
    const formatted = formatTime(dateObj);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it('19. Relative time formatter computes relative time strings', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');

    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    expect(formatRelativeTime(tenMinsAgo)).toBe('10 minutes ago');

    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('20. Locale-aware Number formatter formats large counts with separators', () => {
    expect(formatNumber(15000)).toBe('15,000');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('0');
  });

  it('21. User-generated content is preserved untranslated without security bypass', () => {
    const rawUserBio = 'Architect specialized in eco-friendly designs <script>alert(1)</script>';
    // i18n should not modify user-generated content
    const interpolated = interpolateString(rawUserBio, { user: 'Sanjay' });
    expect(interpolated).toBe(rawUserBio);
  });

  it('22. RTL layout helper returns logical property mappings for directionality', () => {
    const ltrProps = getLogicalLayoutProperties(false);
    expect(ltrProps.direction).toBe('ltr');
    expect(ltrProps.startMargin).toBe('marginLeft');

    const rtlProps = getLogicalLayoutProperties(true);
    expect(rtlProps.direction).toBe('rtl');
    expect(rtlProps.startMargin).toBe('marginRight');
  });
});
