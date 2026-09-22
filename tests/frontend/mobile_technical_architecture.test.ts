import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Native Mobile Technical Architecture & Project Foundation Planning (Module 32)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  describe('1. Mobile Technical Architecture Specification Artifact', () => {
    it('should verify MOBILE_TECHNICAL_ARCHITECTURE.md exists and specifies React Native recommendation', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_TECHNICAL_ARCHITECTURE.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('React Native + TypeScript');
      expect(content).toContain('PRESENTATION LAYER');
      expect(content).toContain('APPLICATION LAYER');
      expect(content).toContain('DOMAIN LAYER');
      expect(content).toContain('DATA / API LAYER');
      expect(content).toContain('PLATFORM LAYER');
      expect(content).toContain('StorageAdapter');
      expect(content).toContain('CameraAdapter');
      expect(content).toContain('FilePickerAdapter');
      expect(content).toContain('NotificationAdapter');
      expect(content).toContain('BiometricAdapter');
      expect(content).toContain('DeepLinkAdapter');
      expect(content).toContain('PHASE 2 — MOBILE TECHNICAL ARCHITECTURE: COMPLETE');
    });
  });

  describe('2. Architecture Decision Records (ADRs)', () => {
    it('should verify MOBILE_ARCHITECTURE_DECISIONS.md exists and contains ADR-001 through ADR-005', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_ARCHITECTURE_DECISIONS.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('ADR-001: Mobile Framework Selection');
      expect(content).toContain('ADR-002: API & Domain Code Reuse Strategy');
      expect(content).toContain('ADR-003: Secure Token Storage Adapter');
      expect(content).toContain('ADR-004: Native Platform Capability Abstraction Boundary');
      expect(content).toContain('ADR-005: Navigation Stack Architecture');
    });
  });

  describe('3. Cross-Document Alignment', () => {
    it('should verify MOBILE_APP_READINESS.md references technical architecture and decision documents', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_APP_READINESS.md');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('MOBILE_TECHNICAL_ARCHITECTURE.md');
      expect(content).toContain('MOBILE_ARCHITECTURE_DECISIONS.md');
    });
  });

});
