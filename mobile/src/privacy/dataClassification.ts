/**
 * Centralized Mobile Data Classification & Governance Model for DBC Mobile Application.
 * Establishes strict data governance rules, classification tiers, and utility mappings
 * based on actual business data usage across authentication, profile, marketplace, projects,
 * financials, messaging, documents, and technical diagnostics.
 */

export type DataClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'PERSONAL' | 'SENSITIVE' | 'RESTRICTED';

export type DataCategory =
  | 'identity_auth'
  | 'profile'
  | 'marketplace'
  | 'project'
  | 'financial'
  | 'communication'
  | 'document'
  | 'technical_diagnostic';

export interface DataFieldClassification {
  field: string;
  category: DataCategory;
  level: DataClassificationLevel;
  description: string;
  allowedInCache: boolean;
  allowedInTelemetry: boolean;
  allowedInLocalStorage: boolean;
}

const DATA_CLASSIFICATION_REGISTRY: Record<string, DataFieldClassification> = {
  // Identity & Authentication
  otp: {
    field: 'otp',
    category: 'identity_auth',
    level: 'RESTRICTED',
    description: '6-digit email OTP verification code',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  password: {
    field: 'password',
    category: 'identity_auth',
    level: 'RESTRICTED',
    description: 'Account login password',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  access_token: {
    field: 'access_token',
    category: 'identity_auth',
    level: 'RESTRICTED',
    description: 'JWT API bearer access token',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: true, // Persisted via StorageAdapter abstraction only
  },
  refresh_token: {
    field: 'refresh_token',
    category: 'identity_auth',
    level: 'RESTRICTED',
    description: 'JWT session refresh token',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: true, // Persisted via StorageAdapter abstraction only
  },
  user_id: {
    field: 'user_id',
    category: 'identity_auth',
    level: 'INTERNAL',
    description: 'System user unique identifier',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: true,
  },
  role: {
    field: 'role',
    category: 'identity_auth',
    level: 'INTERNAL',
    description: 'User access role (customer, contractor, admin)',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: true,
  },

  // Profile Data
  email: {
    field: 'email',
    category: 'profile',
    level: 'PERSONAL',
    description: 'User primary email address',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: true,
  },
  phone: {
    field: 'phone',
    category: 'profile',
    level: 'PERSONAL',
    description: 'User contact phone number',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: true,
  },
  full_name: {
    field: 'full_name',
    category: 'profile',
    level: 'PERSONAL',
    description: 'User full display name',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: true,
  },
  address: {
    field: 'address',
    category: 'profile',
    level: 'PERSONAL',
    description: 'Customer physical street address',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  city: {
    field: 'city',
    category: 'profile',
    level: 'PUBLIC',
    description: 'User operating city / geographic region',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: true,
  },

  // Marketplace Data
  search_query: {
    field: 'search_query',
    category: 'marketplace',
    level: 'PUBLIC',
    description: 'Marketplace category/service search term',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: false,
  },
  trade_category: {
    field: 'trade_category',
    category: 'marketplace',
    level: 'PUBLIC',
    description: 'Contractor trade specialty category',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: false,
  },

  // Project Data
  project_id: {
    field: 'project_id',
    category: 'project',
    level: 'INTERNAL',
    description: 'Project unique identifier',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: false,
  },
  project_title: {
    field: 'project_title',
    category: 'project',
    level: 'INTERNAL',
    description: 'Project title and brief summary',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  milestone_details: {
    field: 'milestone_details',
    category: 'project',
    level: 'INTERNAL',
    description: 'Project milestone scope and timeline',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },

  // Financial Data
  milestone_amount: {
    field: 'milestone_amount',
    category: 'financial',
    level: 'SENSITIVE',
    description: 'Project milestone cost in INR',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  transaction_receipt: {
    field: 'transaction_receipt',
    category: 'financial',
    level: 'SENSITIVE',
    description: 'Payment transaction reference receipt (txn_*)',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  bank_account_number: {
    field: 'bank_account_number',
    category: 'financial',
    level: 'RESTRICTED',
    description: 'Contractor payout bank account number',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  cvv: {
    field: 'cvv',
    category: 'financial',
    level: 'RESTRICTED',
    description: 'Card verification value',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  credit_card: {
    field: 'credit_card',
    category: 'financial',
    level: 'RESTRICTED',
    description: 'Credit or debit card primary account number',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },

  // Communication & Documents
  message_body: {
    field: 'message_body',
    category: 'communication',
    level: 'PERSONAL',
    description: 'User direct message text content',
    allowedInCache: true,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },
  document_url: {
    field: 'document_url',
    category: 'document',
    level: 'SENSITIVE',
    description: 'Project document attachment URL',
    allowedInCache: false,
    allowedInTelemetry: false,
    allowedInLocalStorage: false,
  },

  // Technical Diagnostics
  app_version: {
    field: 'app_version',
    category: 'technical_diagnostic',
    level: 'INTERNAL',
    description: 'Application release version string',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: true,
  },
  network_status: {
    field: 'network_status',
    category: 'technical_diagnostic',
    level: 'INTERNAL',
    description: 'Client network connectivity state',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: false,
  },
};

/**
 * Retrieves data field classification for a given field name or key.
 */
export function getFieldClassification(fieldName: string): DataFieldClassification {
  const normalizedKey = fieldName.toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (DATA_CLASSIFICATION_REGISTRY[normalizedKey]) {
    return DATA_CLASSIFICATION_REGISTRY[normalizedKey];
  }

  // Fallback pattern matching for unlisted fields
  if (
    normalizedKey.includes('token') ||
    normalizedKey.includes('password') ||
    normalizedKey.includes('otp') ||
    normalizedKey.includes('card') ||
    normalizedKey.includes('cvv') ||
    normalizedKey.includes('bank') ||
    normalizedKey.includes('secret')
  ) {
    return {
      field: fieldName,
      category: 'identity_auth',
      level: 'RESTRICTED',
      description: 'Inferred restricted authentication/financial credential',
      allowedInCache: false,
      allowedInTelemetry: false,
      allowedInLocalStorage: false,
    };
  }

  if (
    normalizedKey.includes('email') ||
    normalizedKey.includes('phone') ||
    normalizedKey.includes('address') ||
    normalizedKey.includes('name') ||
    normalizedKey.includes('message')
  ) {
    return {
      field: fieldName,
      category: 'profile',
      level: 'PERSONAL',
      description: 'Inferred personal user information',
      allowedInCache: true,
      allowedInTelemetry: false,
      allowedInLocalStorage: false,
    };
  }

  if (
    normalizedKey.includes('amount') ||
    normalizedKey.includes('price') ||
    normalizedKey.includes('payment') ||
    normalizedKey.includes('document')
  ) {
    return {
      field: fieldName,
      category: 'financial',
      level: 'SENSITIVE',
      description: 'Inferred sensitive financial or document data',
      allowedInCache: true,
      allowedInTelemetry: false,
      allowedInLocalStorage: false,
    };
  }

  return {
    field: fieldName,
    category: 'technical_diagnostic',
    level: 'INTERNAL',
    description: 'General internal application data',
    allowedInCache: true,
    allowedInTelemetry: true,
    allowedInLocalStorage: false,
  };
}

/**
 * Checks whether a given field is allowed to be cached in generic memory cache.
 */
export function isAllowedInCache(fieldName: string): boolean {
  return getFieldClassification(fieldName).allowedInCache;
}

/**
 * Checks whether a given field is allowed to be transmitted in telemetry/analytics logs.
 */
export function isAllowedInTelemetry(fieldName: string): boolean {
  return getFieldClassification(fieldName).allowedInTelemetry;
}

/**
 * Returns true if data level is RESTRICTED or SENSITIVE.
 */
export function isSensitiveOrRestricted(level: DataClassificationLevel): boolean {
  return level === 'RESTRICTED' || level === 'SENSITIVE';
}
