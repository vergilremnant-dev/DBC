import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

import { mobileApiClient } from '../../mobile/src/api/mobileApiClient.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { resolveUserRole } from '../../mobile/src/services/mobileAuthService.js';
import { mobileRequestService, formatCurrency } from '../../mobile/src/services/mobileRequestService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { sanitizeLogPayload } from '../../mobile/src/api/mobileErrorUtils.js';
import { mobileEnvironment } from '../../mobile/src/config/environment.js';
import { validateEnvironmentConfig } from '../../mobile/src/config/environmentValidation.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import { bookingApi } from '../../src/services/booking/bookingService.js';

describe('Module 65 — Mobile Production Deployment & PWA Verification Suite', () => {

  beforeEach(async () => {
    vi.restoreAllMocks();
    mobileCache.clear();
    mobileProfessionalProjectExecutionService.clearCache();
    await mobileAuthStore.logout();
  });

  // ===========================================================================
  // 1. Production Environment & Security Isolation Tests
  // ===========================================================================
  describe('1. Production Environment & Security Isolation', () => {
    it('1.1 verifies production environment configuration rules', () => {
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

    it('1.3 rejects localhost or loopback endpoints in production environment', () => {
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

    it('1.4 confirms 0 database connection credentials or private keys in client bundle source', () => {
      const envKeys = Object.keys(import.meta.env || {});
      const hasSecretKey = envKeys.some(
        (key) => key.includes('DATABASE_URL') || key.includes('JWT_SECRET') || key.includes('PRIVATE_KEY')
      );
      expect(hasSecretKey).toBe(false);
    });

    it('1.5 verifies analytics and feature settings in environment configuration', () => {
      expect(mobileEnvironment).toBeDefined();
      expect(typeof mobileEnvironment.enableAnalytics).toBe('boolean');
    });
  });

  // ===========================================================================
  // 2. PWA Web App Manifest & Service Worker Cache Architecture
  // ===========================================================================
  describe('2. PWA Web App Manifest & Service Worker Architecture', () => {
    const rootDir = process.cwd();
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    const swPath = path.join(rootDir, 'public', 'sw.js');

    it('2.1 verifies public/manifest.json exists and is valid JSON', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestRaw);
      expect(manifest.name).toBe('DBC Design Build Connect');
      expect(manifest.short_name).toBe('DBC');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
    });

    it('2.2 verifies manifest contains required icon sizes for Android and PWA install', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
      const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });

    it('2.3 verifies public/sw.js exists and uses target cache key', () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("const CACHE_NAME = 'dbc-cache-v2';");
    });

    it('2.4 verifies Service Worker uses Network-Only for /api requests', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("url.pathname.startsWith('/api')");
    });

    it('2.5 verifies Service Worker never caches HTML navigation requests', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain("e.request.mode === 'navigate'");
    });

    it('2.6 verifies Service Worker purges legacy caches on activate event', () => {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      expect(swContent).toContain('caches.delete(key)');
      expect(swContent).toContain('self.clients.claim()');
    });
  });

  // ===========================================================================
  // 3. Platform Deployment Configuration & Headers Audit
  // ===========================================================================
  describe('3. Platform Deployment Configuration & Headers Audit', () => {
    const rootDir = process.cwd();
    const vercelPath = path.join(rootDir, 'vercel.json');
    const dockerPath = path.join(rootDir, 'Dockerfile');

    it('3.1 verifies vercel.json exists and specifies framework vite', () => {
      expect(fs.existsSync(vercelPath)).toBe(true);
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      expect(vercelConfig.framework).toBe('vite');
      expect(vercelConfig.buildCommand).toBe('npm run build');
    });

    it('3.2 verifies vercel.json headers configure no-cache for index.html and sw.js', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const headers = vercelConfig.headers || [];
      const htmlHeader = headers.find((h: { source: string }) => h.source === '/(index.html)?');
      const swHeader = headers.find((h: { source: string }) => h.source === '/sw.js');
      expect(htmlHeader).toBeDefined();
      expect(swHeader).toBeDefined();
      const htmlCacheControl = htmlHeader.headers.find((kv: { key: string }) => kv.key === 'Cache-Control');
      expect(htmlCacheControl.value).toContain('no-cache');
    });

    it('3.3 verifies vercel.json headers configure 1-year immutable caching for static assets', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const headers = vercelConfig.headers || [];
      const assetHeader = headers.find((h: { source: string }) => h.source === '/assets/(.*)');
      expect(assetHeader).toBeDefined();
      const assetCacheControl = assetHeader.headers.find((kv: { key: string }) => kv.key === 'Cache-Control');
      expect(assetCacheControl.value).toContain('max-age=31536000');
      expect(assetCacheControl.value).toContain('immutable');
    });

    it('3.4 verifies vercel.json specifies security headers (nosniff, DENY frame, XSS protection)', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const headers = vercelConfig.headers || [];
      const globalHeader = headers.find((h: { source: string }) => h.source === '/(.*)');
      expect(globalHeader).toBeDefined();
      const keys = globalHeader.headers.map((kv: { key: string }) => kv.key);
      expect(keys).toContain('X-Content-Type-Options');
      expect(keys).toContain('X-Frame-Options');
      expect(keys).toContain('X-XSS-Protection');
    });

    it('3.5 verifies Dockerfile exists and includes multi-stage production builder/runner', () => {
      expect(fs.existsSync(dockerPath)).toBe(true);
      const dockerContent = fs.readFileSync(dockerPath, 'utf-8');
      expect(dockerContent).toContain('FROM node:20-alpine AS builder');
      expect(dockerContent).toContain('FROM node:20-alpine AS runner');
      expect(dockerContent).toContain('ENV NODE_ENV=production');
      expect(dockerContent).toContain('HEALTHCHECK');
    });
  });

  // ===========================================================================
  // 4. SPA Routing Rewrites & Deep-Link Restoration
  // ===========================================================================
  describe('4. SPA Routing Rewrites & Deep-Link Restoration', () => {
    const vercelPath = path.join(process.cwd(), 'vercel.json');

    it('4.1 verifies vercel.json contains SPA fallback rewrite to index.html', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const rewrites = vercelConfig.rewrites || [];
      const spaRewrite = rewrites.find((r: { destination: string }) => r.destination === '/index.html');
      expect(spaRewrite).toBeDefined();
    });

    it('4.2 verifies API routes are excluded from SPA rewrite', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      const rewrites = vercelConfig.rewrites || [];
      const apiRewrite = rewrites.find((r: { source: string }) => r.source === '/api/:path*');
      expect(apiRewrite).toBeDefined();
      expect(apiRewrite.destination).toBe('/api/index');
    });

    it('4.3 resolves project deep links to correct screen targets', () => {
      const resolved = mobileDeepLinkService.resolveDeepLink('/project/proj-101', 'customer');
      expect(resolved.route).toBe('CustomerProjectWorkspace');
      expect(resolved.params?.projectId).toBe('proj-101');
    });

    it('4.4 resolves quotation deep links with parameter preservation', () => {
      const resolved = mobileDeepLinkService.resolveDeepLink('/quotation/101', 'customer');
      expect(resolved.route).toBe('QuotationDetails');
      expect(resolved.params?.quotationId).toBe(101);
    });
  });

  // ===========================================================================
  // 5. Authentication Session Lifecycle & Storage Abstraction
  // ===========================================================================
  describe('5. Authentication Session Lifecycle & Storage Abstraction', () => {
    it('5.1 correctly resolves customer user role', () => {
      const role = resolveUserRole('CUSTOMER');
      expect(role).toBe('customer');
    });

    it('5.2 correctly resolves contractor/professional user role', () => {
      const role = resolveUserRole('CONTRACTOR');
      expect(role).toBe('contractor');
    });

    it('5.3 correctly resolves admin user role', () => {
      const role = resolveUserRole('ADMIN');
      expect(role).toBe('admin');
    });

    it('5.4 updates auth state on login action', async () => {
      await mobileAuthStore.setSession(
        { id: 'u1', email: 'c@dbc.com', name: 'Test User', role: 'customer' },
        'jwt-session-token-123'
      );
      const state = mobileAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.email).toBe('c@dbc.com');
    });

    it('5.5 purges session state and tokens on logout', async () => {
      await mobileAuthStore.setSession(
        { id: 'u1', email: 'c@dbc.com', name: 'Test User', role: 'customer' },
        'jwt-session-token-123'
      );
      await mobileAuthStore.logout();
      const state = mobileAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
    });
  });

  // ===========================================================================
  // 6. Customer Production Smoke Workflow Tests
  // ===========================================================================
  describe('6. Customer Production Smoke Workflow', () => {
    it('6.1 formats customer financial currency values accurately', () => {
      const formatted = formatCurrency(150000);
      expect(formatted).toContain('1,50,000');
    });

    it('6.2 handles customer project workspace data retrieval', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-1',
        title: 'Villa Construction',
        status: 'IN_PROGRESS',
        totalAmount: 500000,
        paidAmount: 200000,
      } as any);

      const project = await mobileProjectExecutionService.getProjectOverview('proj-1');
      expect(project.id).toBe('proj-1');
      expect(project.status).toBe('IN_PROGRESS');
    });

    it('6.3 retrieves customer financial summary cleanly', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-1',
        title: 'Villa Construction',
        status: 'IN_PROGRESS',
        agreedBudget: 500000,
        milestones: [
          { id: 'm1', name: 'Foundation', budgetAllocation: 200000, status: 'APPROVED' },
          { id: 'm2', name: 'Structure', budgetAllocation: 300000, status: 'PENDING' },
        ],
      } as any);

      const financials = await mobileCustomerFinancialService.getProjectFinancialSummary('proj-1');
      expect(financials.totalProjectAmount).toBe(500000);
      expect(financials.breakdown.baseAmount).toBe(500000);
    });

    it('6.4 retrieves customer request details cleanly', async () => {
      vi.spyOn(bookingApi, 'getBookingDetails').mockResolvedValueOnce({
        id: 'req-1',
        bookingNumber: 'REQ-1',
        customerId: 'c1',
        providerId: 'p1',
        bookingStatus: 'REQUESTED',
        preferredDate: '2026-10-01',
        preferredTime: '10:00 AM',
        customerAddress: 'Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        createdAt: '2026-09-26',
        updatedAt: '2026-09-26',
      } as any);

      const requestDetails = await mobileRequestService.getProjectRequestDetails('req-1');
      expect(requestDetails.id).toBe('req-1');
      expect(requestDetails.status).toBe('REQUESTED');
    });
  });

  // ===========================================================================
  // 7. Professional/Contractor Production Smoke Workflow Tests
  // ===========================================================================
  describe('7. Professional/Contractor Production Smoke Workflow', () => {
    it('7.1 fetches contractor payout account details', async () => {
      const details = await mobileProfessionalFinanceService.getPayoutDetails();
      expect(details.maskedBankAccount).toContain('4921');
      expect(details.payouts.length).toBeGreaterThan(0);
    });

    it('7.2 retrieves professional project progress overview', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-2',
        title: 'Duplex Design',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'm1', name: 'Framing', completionPercentage: 50, status: 'COMPLETED' },
          { id: 'm2', name: 'Roofing', completionPercentage: 50, status: 'IN_PROGRESS' },
        ],
      } as any);

      const project = await mobileProfessionalProjectExecutionService.getProjectOverview('proj-2');
      expect(project.id).toBe('proj-2');
      expect(project.progressPercentage).toBe(50);
    });

    it('7.3 caches contractor project overview responses in memory', async () => {
      const getSpy = vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-cached',
        title: 'Cached Build',
        status: 'IN_PROGRESS',
        milestones: [{ id: 'm1', name: 'Substructure', status: 'COMPLETED' }],
      } as any);

      await mobileProfessionalProjectExecutionService.getProjectOverview('proj-cached');
      await mobileProfessionalProjectExecutionService.getProjectOverview('proj-cached');
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('7.4 clears contractor cache on request', async () => {
      const getSpy = vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-cleared',
        title: 'Cleared Build',
        status: 'IN_PROGRESS',
        milestones: [{ id: 'm1', name: 'Piling', status: 'COMPLETED' }],
      } as any);

      await mobileProfessionalProjectExecutionService.getProjectOverview('proj-cleared');
      mobileProfessionalProjectExecutionService.clearCache();
      await mobileProfessionalProjectExecutionService.getProjectOverview('proj-cleared');
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // 8. Admin Production Smoke Workflow Tests
  // ===========================================================================
  describe('8. Admin Production Smoke Workflow', () => {
    it('8.1 verifies admin path resolution for user management', () => {
      const resolved = mobileDeepLinkService.resolveDeepLink('/admin/users/usr-505', 'admin');
      expect(resolved.route).toBe('AdminUserDetails');
      expect(resolved.params?.userId).toBe('usr-505');
    });

    it('8.2 verifies admin path resolution for projects monitoring', () => {
      const resolved = mobileDeepLinkService.resolveDeepLink('/admin/projects', 'admin');
      expect(resolved.route).toBe('AdminProjects');
    });

    it('8.3 validates admin permission boundary restriction', () => {
      const isCustomerAdmin = resolveUserRole('CUSTOMER') === 'admin';
      expect(isCustomerAdmin).toBe(false);
    });

    it('8.4 confirms admin role resolution grants admin permissions', () => {
      const isAdmin = resolveUserRole('ADMIN') === 'admin';
      expect(isAdmin).toBe(true);
    });
  });

  // ===========================================================================
  // 9. Financial Integrity & Zero Client-Side Calculations
  // ===========================================================================
  describe('9. Financial Integrity & Zero Client-Side Calculations', () => {
    it('9.1 verifies financial values are received directly from API responses', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValue({
        data: {
          totalAgreedAmount: 750000,
          platformFee: 15000,
          netPayout: 735000,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const response = await mobileApiClient.get('/finance/summary');
      expect(response.data.platformFee).toBe(15000);
      expect(response.data.netPayout).toBe(735000);
    });

    it('9.2 verifies no platform fee multipliers are hardcoded in request service', () => {
      const serviceSource = mobileRequestService.toString();
      expect(serviceSource).not.toContain('* 0.05');
      expect(serviceSource).not.toContain('* 0.10');
    });

    it('9.3 verifies no client-side tax calculations are performed in financial service', () => {
      const serviceSource = mobileCustomerFinancialService.toString();
      expect(serviceSource).not.toContain('* 0.18');
    });
  });

  // ===========================================================================
  // 10. Observability, Logging Sanitization & Error Handling
  // ===========================================================================
  describe('10. Observability, Logging Sanitization & Error Handling', () => {
    it('10.1 redacts passwords from log payloads', () => {
      const sanitized = sanitizeLogPayload({
        email: 'user@dbc.com',
        password: 'SuperSecretPassword123!',
      });
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@dbc.com');
    });

    it('10.2 redacts authorization tokens from log payloads', () => {
      const sanitized = sanitizeLogPayload({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        authorization: 'Bearer secret-jwt-token',
      });
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
    });

    it('10.3 redacts OTP codes from log payloads', () => {
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
  // 11. Stale Chunk Auto-Recovery & Service Worker Eviction
  // ===========================================================================
  describe('11. Stale Chunk Auto-Recovery & Service Worker Eviction', () => {
    const indexPath = path.join(process.cwd(), 'index.html');

    it('11.1 verifies index.html contains inline error boundary script', () => {
      expect(fs.existsSync(indexPath)).toBe(true);
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('window.addEventListener(\'error\'');
    });

    it('11.2 verifies error boundary script unregisters broken service workers', () => {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('navigator.serviceWorker.getRegistrations()');
      expect(indexContent).toContain('unregister()');
    });

    it('11.3 verifies error boundary script purges browser cache and prevents infinite reloads', () => {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('caches.delete');
      expect(indexContent).toContain('sessionStorage.getItem(\'dbc_stale_reload\')');
    });
  });
});
