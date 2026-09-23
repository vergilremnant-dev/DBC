export interface MobileUserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'customer' | 'contractor' | 'admin';
  avatarUrl?: string;
  city?: string;
  address?: string;
  businessName?: string;
  category?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface MobileProfileUpdate {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  city?: string;
  address?: string;
  businessName?: string;
  category?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface MobileAccountSettings {
  email: string;
  phone?: string;
  role: 'customer' | 'contractor' | 'admin';
  sessionStatus: 'ACTIVE' | 'EXPIRED';
  securityModel: 'OTP_VERIFIED';
  otpVerified: boolean;
  notificationsEnabled: boolean;
}

export interface MobileSecuritySettings {
  authMethod: 'OTP_VERIFICATION';
  verifiedContact: string;
  sessionEncrypted: boolean;
  activeSessionsCount: number;
}

export interface MobileNotificationPreferences {
  projectUpdates: boolean;
  messages: boolean;
  quotationUpdates: boolean;
  paymentUpdates: boolean;
}

export interface ImagePickerResult {
  cancelled: boolean;
  base64?: string;
  uri?: string;
  fileName?: string;
}
