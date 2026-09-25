/**
 * Mobile Environment Validation & Production Release Safeguards.
 * Enforces strict environment boundaries: prevents production build from silently
 * falling back to localhost or unencrypted HTTP endpoints.
 */

import { MobileEnvironmentConfig } from './environment';

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates environment configuration parameters against environment-specific rules.
 */
export function validateEnvironmentConfig(config: MobileEnvironmentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config) {
    errors.push('Environment configuration object is missing or undefined.');
    return { isValid: false, errors };
  }

  const { environment, apiBaseUrl } = config;

  if (environment === 'production') {
    if (!apiBaseUrl) {
      errors.push('Production API Base URL is required.');
    } else {
      const lowerUrl = apiBaseUrl.toLowerCase();
      if (lowerUrl.includes('localhost') || lowerUrl.includes('127.0.0.1')) {
        errors.push('Production API Base URL must not point to localhost or 127.0.0.1.');
      }
      if (lowerUrl.startsWith('http://')) {
        errors.push('Production API Base URL must use encrypted HTTPS protocol (http:// is prohibited).');
      }
    }
  } else if (environment === 'staging') {
    if (!apiBaseUrl) {
      errors.push('Staging API Base URL is required.');
    } else {
      const lowerUrl = apiBaseUrl.toLowerCase();
      if (lowerUrl.includes('localhost') || lowerUrl.includes('127.0.0.1')) {
        errors.push('Staging API Base URL must not point to localhost.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Ensures valid environment configuration or throws EnvironmentValidationError.
 */
export function assertValidEnvironmentConfig(config: MobileEnvironmentConfig): void {
  const result = validateEnvironmentConfig(config);
  if (!result.isValid) {
    throw new EnvironmentValidationError(
      `PRODUCTION_CONFIGURATION_ERROR: ${result.errors.join(' ')}`
    );
  }
}

export interface RuntimeBuildMetadata {
  appVersion: string;
  environment: string;
  apiBaseUrl: string;
  buildTimestamp: string;
  isHttps: boolean;
}

/**
 * Exposes safe, non-sensitive runtime build metadata for diagnostics and observability.
 */
export function getRuntimeBuildMetadata(config: MobileEnvironmentConfig): RuntimeBuildMetadata {
  const isHttps = Boolean(config.apiBaseUrl && config.apiBaseUrl.startsWith('https://'));
  return {
    appVersion: '1.0.0',
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl ? config.apiBaseUrl.split('?')[0] : '',
    buildTimestamp: new Date().toISOString(),
    isHttps,
  };
}
