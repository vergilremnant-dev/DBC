import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Native Mobile App Product Architecture & User Flow Planning (Module 31)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  describe('1. Mobile Product Architecture Specification Artifact', () => {
    it('should verify MOBILE_PRODUCT_ARCHITECTURE.md exists and contains required Information Architecture sections', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_PRODUCT_ARCHITECTURE.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Customer Mobile Information Architecture');
      expect(content).toContain('Professional Mobile Information Architecture');
      expect(content).toContain('End-to-End User Journeys');
      expect(content).toContain('Native Device Capabilities Integration Plan');
      expect(content).toContain('Architectural Alignment');
      expect(content).toContain('READY FOR PHASE 2 MOBILE APPLICATION PLANNING');
    });

    it('should verify Customer 5-Tab Navigation structure in documentation', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_PRODUCT_ARCHITECTURE.md');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('Home');
      expect(content).toContain('Requests');
      expect(content).toContain('Projects');
      expect(content).toContain('Messages');
      expect(content).toContain('Account');
    });

    it('should verify Professional 5-Tab Navigation structure in documentation', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_PRODUCT_ARCHITECTURE.md');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('Console');
      expect(content).toContain('Leads');
      expect(content).toContain('Quotes');
      expect(content).toContain('Earnings');
    });
  });

  describe('2. Cross-Document Alignment', () => {
    it('should verify MOBILE_APP_READINESS.md references MOBILE_PRODUCT_ARCHITECTURE.md', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_APP_READINESS.md');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('MOBILE_PRODUCT_ARCHITECTURE.md');
    });
  });

});
