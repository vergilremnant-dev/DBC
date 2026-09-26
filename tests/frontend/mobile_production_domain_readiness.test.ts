import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

import { validateEnvironmentConfig } from '../../mobile/src/config/environmentValidation.js';
import { mobileEnvironment } from '../../mobile/src/config/environment.js';
import { resolveUserRole } from '../../mobile/src/services/mobileAuthService.js';
import { sanitizeLogPayload } from '../../mobile/src/api/mobileErrorUtils.js';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';

describe('Module 66 — Mobile Production Domain Activation & Go-Live Readiness Verification Suite', () => {

  beforeEach(async () => {
    vi.restoreAllMocks();
    mobileCache.clear();
    await mobileAuthStore.logout();
  });

  // ===========================================================================
  // 1. Production Domain & Endpoint Configuration Rules
  // ===========================================================================
  describe('1. Production Domain & Endpoint Configuration Rules', () => {
    it('1.1 validates production environment configuration rules for dbc.com domain', () => {
      const validation = validateEnvironmentConfig({
        environment: 'production',
        apiBaseUrl: 'https://api.dbc.com',
        timeoutMs: 15000,
        enablePushNotifications: true,
        enableBiometrics: true,
        enableAnalytics: true,
      });
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('1.2 rejects non-HTTPS production API endpoints', () => {
      const validation = validateEnvironmentConfig({
        environment: 'production',
        apiBaseUrl: 'http://api.dbc.com',
        timeoutMs: 15000,
        enablePushNotifications: true,
        enableBiometrics: true,
        enableAnalytics: true,
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Production API Base URL must use encrypted HTTPS protocol (http:// is prohibited).');
    });

    it('1.3 rejects localhost or loopback endpoints in production configuration', () => {
      const validation = validateEnvironmentConfig({
        environment: 'production',
        apiBaseUrl: 'https://localhost:5000',
        timeoutMs: 15000,
        enablePushNotifications: true,
        enableBiometrics: true,
        enableAnalytics: true,
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Production API Base URL must not point to localhost or 127.0.0.1.');
    });

    it('1.4 confirms staging environment correctly configures staging API base URL', () => {
      const validation = validateEnvironmentConfig({
        environment: 'staging',
        apiBaseUrl: 'https://staging-api.dbc.com',
        timeoutMs: 15000,
        enablePushNotifications: true,
        enableBiometrics: true,
        enableAnalytics: true,
      });
      expect(validation.isValid).toBe(true);
    });

    it('1.5 verifies production timeout configuration parameter is set to 15000ms', () => {
      expect(mobileEnvironment.timeoutMs).toBe(15000);
    });
  });

  // ===========================================================================
  // 2. DNS Audit & Provider Requirement Integrity
  // ===========================================================================
  describe('2. DNS Audit & Provider Requirement Integrity', () => {
    const rootDir = process.cwd();
    const auditDocPath = path.join(rootDir, 'documentation', 'MOBILE_PRODUCTION_DOMAIN_AUDIT.md');

    it('2.1 verifies MOBILE_PRODUCTION_DOMAIN_AUDIT.md document exists', () => {
      expect(fs.existsSync(auditDocPath)).toBe(true);
    });

    it('2.2 verifies document specifies expected Vercel apex IP target (76.76.21.21)', () => {
      const content = fs.readFileSync(auditDocPath, 'utf-8');
      expect(content).toContain('76.76.21.21');
    });

    it('2.3 verifies document specifies expected CNAME target (cname.vercel-dns.com)', () => {
      const content = fs.readFileSync(auditDocPath, 'utf-8');
      expect(content).toContain('cname.vercel-dns.com');
    });

    it('2.4 verifies pending DNS state is classified as DNS PENDING', () => {
      const content = fs.readFileSync(auditDocPath, 'utf-8');
      expect(content).toContain('DNS PENDING');
    });
  });

  // ===========================================================================
  // 3. Web/PWA Application Identity & Manifest Audit
  // ===========================================================================
  describe('3. Web/PWA Application Identity & Manifest Audit', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');

    it('3.1 verifies public/manifest.json exists', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it('3.2 asserts application name in manifest is DBC Design Build Connect', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.name).toBe('DBC Design Build Connect');
      expect(manifest.short_name).toBe('DBC');
    });

    it('3.3 asserts display mode is set to standalone for mobile experience', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.display).toBe('standalone');
    });

    it('3.4 asserts primary emerald theme color (#10b981) is configured', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.theme_color).toBe('#10b981');
    });

    it('3.5 verifies required PWA icon sizes (192x192 and 512x512) exist in manifest', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });
  });

  // ===========================================================================
  // 4. Service Worker Caching & API Network Isolation
  // ===========================================================================
  describe('4. Service Worker Caching & API Network Isolation', () => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');

    it('4.1 verifies public/sw.js exists', () => {
      expect(fs.existsSync(swPath)).toBe(true);
    });

    it('4.2 asserts Service Worker uses cache key dbc-cache-v2', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("const CACHE_NAME = 'dbc-cache-v2';");
    });

    it('4.3 asserts Service Worker excludes /api requests from caching', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("url.pathname.startsWith('/api')");
    });

    it('4.4 asserts Service Worker uses Network-First strategy for navigate requests', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("e.request.mode === 'navigate'");
    });

    it('4.5 asserts Service Worker claims clients on activate listener', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain('self.clients.claim()');
    });
  });

  // ===========================================================================
  // 5. Platform Deployment Configuration & Security Headers Audit
  // ===========================================================================
  describe('5. Platform Deployment Configuration & Security Headers Audit', () => {
    const vercelPath = path.join(process.cwd(), 'vercel.json');

    it('5.1 verifies vercel.json specifies framework vite and build command', () => {
      expect(fs.existsSync(vercelPath)).toBe(true);
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      expect(vercelConfig.framework).toBe('vite');
      expect(vercelConfig.buildCommand).toBe('npm run build');
    });

    it('5.2 asserts SPA fallback rewrite routes to index.html', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const rewrites = vercelConfig.rewrites || [];
      const spaRewrite = rewrites.find((r: { destination: string }) => r.destination === '/index.html');
      expect(spaRewrite).toBeDefined();
    });

    it('5.3 asserts API routes are rewritten to /api/index serverless function', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const rewrites = vercelConfig.rewrites || [];
      const apiRewrite = rewrites.find((r: { source: string }) => r.source === '/api/:path*');
      expect(apiRewrite).toBeDefined();
      expect(apiRewrite.destination).toBe('/api/index');
    });

    it('5.4 asserts security headers nosniff, DENY, and XSS protection are configured', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const headers = vercelConfig.headers || [];
      const globalHeader = headers.find((h: { source: string }) => h.source === '/(.*)');
      expect(globalHeader).toBeDefined();
      const keys = globalHeader.headers.map((kv: { key: string }) => kv.key);
      expect(keys).toContain('X-Content-Type-Options');
      expect(keys).toContain('X-Frame-Options');
      expect(keys).toContain('X-XSS-Protection');
    });

    it('5.5 asserts static assets in /assets/ receive 1-year immutable cache header', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const headers = vercelConfig.headers || [];
      const assetHeader = headers.find((h: { source: string }) => h.source === '/assets/(.*)');
      expect(assetHeader).toBeDefined();
      const assetCacheControl = assetHeader.headers.find((kv: { key: string }) => kv.key === 'Cache-Control');
      expect(assetCacheControl.value).toContain('max-age=31536000');
      expect(assetCacheControl.value).toContain('immutable');
    });
  });

  // ===========================================================================
  // 6. Secret Protection & Telemetry Sanitization Audit
  // ===========================================================================
  describe('6. Secret Protection & Telemetry Sanitization Audit', () => {
    it('6.1 confirms client environment contains 0 database connection passwords or private keys', () => {
      const envKeys = Object.keys(import.meta.env || {});
      const hasSecret = envKeys.some((k) => k.includes('DATABASE_URL') || k.includes('SECRET_KEY') || k.includes('PRIVATE_KEY'));
      expect(hasSecret).toBe(false);
    });

    it('6.2 redacts passwords from log payloads', () => {
      const sanitized = sanitizeLogPayload({
        email: 'user@dbc.com',
        password: 'SuperSecretPassword123!',
      });
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@dbc.com');
    });

    it('6.3 redacts authorization tokens from log payloads', () => {
      const sanitized = sanitizeLogPayload({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        authorization: 'Bearer secret-jwt-token',
      });
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
    });

    it('6.4 redacts OTP verification codes from log payloads', () => {
      const sanitized = sanitizeLogPayload({
        email: 'user@dbc.com',
        otp: '849204',
        otpCode: '123456',
      });
      expect(sanitized.otp).toBe('[REDACTED]');
      expect(sanitized.otpCode).toBe('[REDACTED]');
    });
  });

  // ===========================================================================
  // 7. Go-Live Blocker Classification & Readiness Matrix Audit
  // ===========================================================================
  describe('7. Go-Live Blocker Classification & Readiness Matrix Audit', () => {
    const goLiveDocPath = path.join(process.cwd(), 'documentation', 'MOBILE_GO_LIVE_READINESS.md');

    it('7.1 verifies MOBILE_GO_LIVE_READINESS.md document exists', () => {
      expect(fs.existsSync(goLiveDocPath)).toBe(true);
    });

    it('7.2 verifies P0 blocker classification for unmapped DNS records', () => {
      const content = fs.readFileSync(goLiveDocPath, 'utf-8');
      expect(content).toContain('P0 — Production Launch Blockers');
      expect(content).toContain('BLK-P0-01');
    });

    it('7.3 verifies P1 blocker classification for payment merchant credentials', () => {
      const content = fs.readFileSync(goLiveDocPath, 'utf-8');
      expect(content).toContain('P1 — Core Capability Blockers');
      expect(content).toContain('BLK-P1-01');
    });

    it('7.4 asserts final go-live status matches PRODUCTION GO-LIVE READY — EXTERNAL ACTIVATION REQUIRED', () => {
      const content = fs.readFileSync(goLiveDocPath, 'utf-8');
      expect(content).toContain('PRODUCTION GO-LIVE READY — EXTERNAL ACTIVATION REQUIRED');
    });
  });

  // ===========================================================================
  // 8. Authentication & Role Boundary Guards Audit
  // ===========================================================================
  describe('8. Authentication & Role Boundary Guards Audit', () => {
    it('8.1 correctly resolves customer user role', () => {
      expect(resolveUserRole('CUSTOMER')).toBe('customer');
    });

    it('8.2 correctly resolves contractor/professional user role', () => {
      expect(resolveUserRole('CONTRACTOR')).toBe('contractor');
    });

    it('8.3 correctly resolves admin user role', () => {
      expect(resolveUserRole('ADMIN')).toBe('admin');
    });
  });
});
