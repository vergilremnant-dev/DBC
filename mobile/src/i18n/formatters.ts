/**
 * Centralized Locale-Aware Formatting Utilities for DBC Mobile Application.
 * Standardized formatters for currency, dates, times, numbers, and relative times.
 *
 * CRITICAL RULE:
 * Formatters are STRICTLY presentation-layer functions. They never alter underlying
 * numeric calculations, backend financial amounts, or stored timestamps.
 */

import {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
  RelativeTimeOptions,
} from './localeTypes';
import { getLocale } from './i18n';
import { getStatusAccessibilityInfo } from '../accessibility/accessibilityUtils';

/**
 * Formats a monetary value into a localized currency string (Default: INR ₹).
 * Does NOT perform calculations.
 */
export function formatCurrency(
  amount: number | null | undefined,
  options?: CurrencyFormatOptions
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const locale = options?.locale || getLocale() || 'en-IN';
  const currencyCode = options?.currencyCode || 'INR';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    });
    return formatter.format(amount);
  } catch (_err) {
    // Fallback manual INR formatting if Intl fails
    const formattedNum = amount.toLocaleString('en-IN', {
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    });
    return `₹${formattedNum}`;
  }
}

/**
 * Formats a date string, Date object, or timestamp into a localized date string.
 */
export function formatDate(
  dateValue: string | Date | number | null | undefined,
  options?: DateFormatOptions
): string {
  if (!dateValue) return '';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return String(dateValue);

  const locale = options?.locale || getLocale() || 'en-IN';

  if (options?.includeTime) {
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a timestamp or Date object into a localized time string (e.g., "05:15 PM").
 */
export function formatTime(
  dateValue: string | Date | number | null | undefined,
  localeOverride?: string
): string {
  if (!dateValue) return '';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return '';

  const locale = localeOverride || getLocale() || 'en-IN';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a relative timestamp (e.g., "2 minutes ago", "Yesterday", "3 days ago").
 */
export function formatRelativeTime(
  dateValue: string | Date | number | null | undefined,
  options?: RelativeTimeOptions
): string {
  if (!dateValue) return '';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return String(dateValue);

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }

  return formatDate(date, { locale: options?.locale });
}

/**
 * Formats numbers with locale-aware thousand separators.
 */
export function formatNumber(
  value: number | null | undefined,
  options?: NumberFormatOptions
): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const locale = options?.locale || getLocale() || 'en-IN';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  }).format(value);
}

/**
 * Convenience export for formatStatus.
 */
export function formatStatus(statusCode: string) {
  return getStatusAccessibilityInfo(statusCode);
}
