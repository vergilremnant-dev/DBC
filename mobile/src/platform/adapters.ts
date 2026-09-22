/**
 * Platform Adapters Interface & Fallbacks for DBC Mobile Application.
 * Follows ADR-004: Native Capability Abstraction via Platform Adapter Layer.
 */

export interface CameraResult {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}

export interface CameraAdapter {
  isAvailable(): Promise<boolean>;
  takePhoto(): Promise<CameraResult | null>;
  pickImageFromLibrary(): Promise<CameraResult | null>;
}

export interface FilePickerResult {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface FilePickerAdapter {
  pickDocument(allowedTypes?: string[]): Promise<FilePickerResult | null>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationAdapter {
  requestPermission(): Promise<boolean>;
  getDeviceToken(): Promise<string | null>;
  onNotificationReceived(handler: (payload: PushNotificationPayload) => void): () => void;
}

export interface BiometricAdapter {
  isSupported(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
}

export interface DeepLinkAdapter {
  getInitialUrl(): Promise<string | null>;
  onUrlOpened(handler: (url: string) => void): () => void;
}

// Fallback Implementations for Web & Testing
export class DefaultCameraAdapter implements CameraAdapter {
  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices;
  }

  async takePhoto(): Promise<CameraResult | null> {
    return null;
  }

  async pickImageFromLibrary(): Promise<CameraResult | null> {
    return null;
  }
}

export class DefaultFilePickerAdapter implements FilePickerAdapter {
  async pickDocument(): Promise<FilePickerResult | null> {
    return null;
  }
}

export class DefaultNotificationAdapter implements NotificationAdapter {
  async requestPermission(): Promise<boolean> {
    return false;
  }

  async getDeviceToken(): Promise<string | null> {
    return null;
  }

  onNotificationReceived(): () => void {
    return () => {};
  }
}

export class DefaultBiometricAdapter implements BiometricAdapter {
  async isSupported(): Promise<boolean> {
    return false;
  }

  async authenticate(): Promise<boolean> {
    return false;
  }
}

export class DefaultDeepLinkAdapter implements DeepLinkAdapter {
  async getInitialUrl(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return null;
  }

  onUrlOpened(): () => void {
    return () => {};
  }
}

export const platformAdapters = {
  camera: new DefaultCameraAdapter(),
  filePicker: new DefaultFilePickerAdapter(),
  notification: new DefaultNotificationAdapter(),
  biometric: new DefaultBiometricAdapter(),
  deepLink: new DefaultDeepLinkAdapter(),
};
