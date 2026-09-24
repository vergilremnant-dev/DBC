/**
 * Core Internationalization (i18n) Engine for DBC Mobile Application.
 * Provides string translation lookup, string parameter interpolation,
 * dynamic locale setting, and fallback logic.
 */

import { enLocale, LocaleDictionary } from './locales/en';
import { SupportedLocale, TranslationInterpolationParams } from './localeTypes';

let currentLocale: SupportedLocale = 'en-IN';
const registeredLocales: Record<string, LocaleDictionary> = {
  en: enLocale,
  'en-IN': enLocale,
};

/**
 * Sets the active application locale.
 */
export function setLocale(locale: SupportedLocale): void {
  if (registeredLocales[locale]) {
    currentLocale = locale;
  }
}

/**
 * Gets the active application locale code.
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Interpolates parameter placeholders in string (e.g., "{name}" -> "John").
 */
export function interpolateString(template: string, params?: TranslationInterpolationParams): string {
  if (!params || !template) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Translates a key path (e.g., "common.save", "auth.signIn") into localized text.
 * Falls back safely to English dictionary or key path if missing.
 */
export function t(keyPath: string, params?: TranslationInterpolationParams, localeOverride?: SupportedLocale): string {
  const activeLocale = localeOverride || currentLocale;
  const dict = registeredLocales[activeLocale] || enLocale;

  const parts = keyPath.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string') {
    return interpolateString(current, params);
  }

  // Fallback to English dictionary if overriding locale missing key
  if (dict !== enLocale) {
    let fallbackCurrent: unknown = enLocale;
    for (const part of parts) {
      if (fallbackCurrent && typeof fallbackCurrent === 'object' && part in fallbackCurrent) {
        fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[part];
      } else {
        fallbackCurrent = undefined;
        break;
      }
    }
    if (typeof fallbackCurrent === 'string') {
      return interpolateString(fallbackCurrent, params);
    }
  }

  // Ultimate fallback: return keyPath
  return interpolateString(keyPath, params);
}
