/**
 * Mobile Environment Configuration for DBC Application.
 * Supports environment switching (dev, staging, production) and API URLs.
 */

export interface MobileEnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  timeoutMs: number;
  enablePushNotifications: boolean;
  enableBiometrics: boolean;
  enableAnalytics: boolean;
}

const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
};

export const mobileEnvironment: MobileEnvironmentConfig = {
  environment: (getEnvVar('MOBILE_ENV', 'development') as MobileEnvironmentConfig['environment']),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', getEnvVar('MOBILE_API_BASE_URL', 'http://localhost:3000')),
  timeoutMs: 15000,
  enablePushNotifications: getEnvVar('MOBILE_ENABLE_PUSH', 'true') === 'true',
  enableBiometrics: getEnvVar('MOBILE_ENABLE_BIOMETRICS', 'true') === 'true',
  enableAnalytics: getEnvVar('MOBILE_ENABLE_ANALYTICS', 'false') === 'true',
};
