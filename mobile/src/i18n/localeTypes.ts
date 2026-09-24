/**
 * Locale & Internationalization (i18n) Types for DBC Mobile Application.
 * Standardized type definitions for locale codes, translation keys,
 * formatting parameters, and date/currency options.
 */

export type SupportedLocale = 'en' | 'en-IN';

export interface CurrencyFormatOptions {
  currencyCode?: string; // Default: 'INR'
  locale?: SupportedLocale | string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DateFormatOptions {
  locale?: SupportedLocale | string;
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  customPattern?: string;
  includeTime?: boolean;
}

export interface NumberFormatOptions {
  locale?: SupportedLocale | string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface RelativeTimeOptions {
  locale?: SupportedLocale | string;
  style?: 'long' | 'short' | 'narrow';
}

export type TranslationInterpolationParams = Record<string, string | number>;
