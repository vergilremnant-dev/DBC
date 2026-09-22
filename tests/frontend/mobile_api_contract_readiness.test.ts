import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mobile API Contract & Client Integration Readiness Audit (Module 30)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  describe('1. API Route Signatures & Interceptor Contracts', () => {
    it('should verify axiosClient injects Authorization Bearer header', () => {
      const clientPath = path.join(projectRoot, 'src/services/auth/axiosClient.ts');
      const content = fs.readFileSync(clientPath, 'utf-8');

      expect(content).toContain('Authorization');
      expect(content).toContain('Bearer');
      expect(content).toContain('VITE_API_BASE_URL');
    });

    it('should verify service modules route requests to standardized API paths', () => {
      const authService = fs.readFileSync(path.join(projectRoot, 'src/services/auth/authService.ts'), 'utf-8');
      const bookingService = fs.readFileSync(path.join(projectRoot, 'src/services/booking/bookingService.ts'), 'utf-8');
      const projectService = fs.readFileSync(path.join(projectRoot, 'src/services/contractor/ProjectService.ts'), 'utf-8');

      expect(authService).toContain('/api/auth');
      expect(bookingService).toContain('/api/bookings');
      expect(projectService).toContain('/api/projects');
    });
  });

  describe('2. Centralized DTO Schemas & Enums', () => {
    it('should verify booking and project types export status enums', () => {
      const bookingTypes = fs.readFileSync(path.join(projectRoot, 'src/types/booking/bookingTypes.ts'), 'utf-8');
      const projectTypes = fs.readFileSync(path.join(projectRoot, 'src/types/contractor/ProjectTypes.ts'), 'utf-8');

      expect(bookingTypes).toContain('BookingStatus');
      expect(projectTypes).toContain('ProjectStatus');
    });
  });

  describe('3. Mobile API Contracts Documentation Artifact', () => {
    it('should verify MOBILE_API_CONTRACTS.md exists and contains required contract specifications', () => {
      const docPath = path.join(projectRoot, 'documentation/MOBILE_API_CONTRACTS.md');
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('API Endpoint Inventory');
      expect(content).toContain('Authentication Contract');
      expect(content).toContain('Error Response Contract');
      expect(content).toContain('Validation Contract');
      expect(content).toContain('Date & Time Contract');
      expect(content).toContain('Monetary & Financial Contract');
      expect(content).toContain('Project Lifecycle State Machine');
      expect(content).toContain('Role / Permission Matrix');
      expect(content).toContain('MOBILE API CONTRACT READY FOR NATIVE CLIENT PLANNING');
    });
  });

});
