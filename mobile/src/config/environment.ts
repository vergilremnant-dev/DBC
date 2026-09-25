/**
 * Mobile Environment Configuration for DBC Application.
 * Supports environment switching (dev, staging, production) and API URLs.
 */

import { validateEnvironmentConfig } from './environmentValidation';

export interface MobileEnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  timeoutMs: number;
  enablePushNotifications: boolean;
  enableBiometrics: boolean;
  enableAnalytics: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
};

export function resolveEnvironmentConfig(overrideEnv?: Partial<MobileEnvironmentConfig>): MobileEnvironmentConfig {
  const envType = (overrideEnv?.environment ||
    getEnvVar('VITE_APP_ENV') ||
    getEnvVar('MOBILE_ENV') ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'production' : 'development')) as MobileEnvironmentConfig['environment'];

  let defaultApiUrl = 'http://localhost:3000';
  if (envType === 'production') {
    defaultApiUrl = getEnvVar('VITE_API_BASE_URL') || getEnvVar('MOBILE_API_BASE_URL') || 'https://api.dbc.com';
  } else if (envType === 'staging') {
    defaultApiUrl = getEnvVar('VITE_API_BASE_URL') || getEnvVar('MOBILE_API_BASE_URL') || 'https://staging-api.dbc.com';
  } else {
    defaultApiUrl = getEnvVar('VITE_API_BASE_URL') || getEnvVar('MOBILE_API_BASE_URL') || 'http://localhost:3000';
  }

  const config: MobileEnvironmentConfig = {
    environment: envType,
    apiBaseUrl: overrideEnv?.apiBaseUrl || defaultApiUrl,
    timeoutMs: overrideEnv?.timeoutMs || 15000,
    enablePushNotifications: overrideEnv?.enablePushNotifications ?? (getEnvVar('MOBILE_ENABLE_PUSH', 'true') === 'true'),
    enableBiometrics: overrideEnv?.enableBiometrics ?? (getEnvVar('MOBILE_ENABLE_BIOMETRICS', 'true') === 'true'),
    enableAnalytics: overrideEnv?.enableAnalytics ?? (getEnvVar('MOBILE_ENABLE_ANALYTICS', 'false') === 'true'),
  };

  return config;
}

export const mobileEnvironment: MobileEnvironmentConfig = resolveEnvironmentConfig();
