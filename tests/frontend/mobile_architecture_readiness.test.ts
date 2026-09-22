import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 2 Mobile App Readiness & Shared Architecture Audit (Module 29)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  describe('1. API & Service Layer Isolation', () => {
    it('should verify axiosClient uses environment-driven API base URL', () => {
      const clientPath = path.join(projectRoot, 'src/services/auth/axiosClient.ts');
      const content = fs.readFileSync(clientPath, 'utf-8');

      expect(content).toContain('VITE_API_BASE_URL');
      expect(content).toContain('axios.create');
      expect(content).toContain('getAccessToken');
    });

    it('should verify core domain services exist and are isolated from UI components', () => {
      const services = [
        'auth/authService.ts',
        'booking/bookingService.ts',
        'quotation/quotationClientService.ts',
        'category/categoryService.ts',
        'provider/providerService.ts',
        'search/searchService.ts',
        'contractor/ProjectService.ts',
      ];

      for (const serviceRelPath of services) {
        const fullPath = path.join(projectRoot, 'src/services', serviceRelPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf-8');
        // Core API services should not import React UI JSX or DOM elements
        expect(content).not.toContain('import React');
        expect(content).not.toContain('jsx');
      }
    });
  });

  describe('2. Centralized Domain Types & Schemas', () => {
    it('should verify domain types exist in src/types/', () => {
      const typeFiles = [
        'auth/authTypes.ts',
        'booking/bookingTypes.ts',
        'category/categoryTypes.ts',
        'provider/providerTypes.ts',
        'contractor/ProjectTypes.ts',
      ];

      for (const typeRelPath of typeFiles) {
        const fullPath = path.join(projectRoot, 'src/types', typeRelPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    });
  });

  describe('3. Mobile Readiness Documentation Artifact', () => {
    it('should verify MOBILE_APP_READINESS.md exists and contains reusability sections', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_APP_READINESS.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Reusable Today');
      expect(content).toContain('Minor Adaptation Needed');
      expect(content).toContain('Web-Specific Boundaries');
      expect(content).toContain('Future Native Mobile Requirements');
      expect(content).toContain('READY FOR PHASE 2 MOBILE APPLICATION PLANNING');
    });
  });

});
