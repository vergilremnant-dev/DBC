import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf-8');

describe('Project request flow (front end)', () => {
  const form = read('src/pages/requests/RequestProjectPage.tsx');
  const app = read('src/App.tsx');

  it('routes: public request form, legacy /book-service redirect, customer request pages, real inbox', () => {
    expect(app).toContain('path="/request-project" element={<RequestProjectPage />}');
    expect(app).toContain('path="/book-service" element={<BookServiceRedirect />}');
    expect(app).toContain('path="requests" element={<CustomerRequestsPage />}');
    expect(app).toContain('path="requests/:id" element={<CustomerRequestDetailPage />}');
    expect(app).toContain('<Navigate to="/workspace/requests" replace />');
    expect(app).toContain('path="inbox" element={<ChatPanel />}');
    const redirect = read('src/pages/requests/BookServiceRedirect.tsx');
    expect(redirect).toContain("next.set('professional', professional)");
  });

  it('has no appointment date/time slots and uses project-oriented steps', () => {
    expect(form).not.toMatch(/type="date"|type="time"|preferredTime|timeSlot/);
    expect(form).toContain("const STEPS = ['Service', 'Project', 'Site & budget', 'Photos', 'Review']");
    expect(form).toContain('aria-current={i === step ? \'step\' : undefined}');
    expect(form).toContain('Submit request');
  });

  it('asks different questions for design/consultancy and construction trades', () => {
    expect(form).toContain('WHITE_COLLAR: [');
    expect(form).toContain('BLUE_COLLAR: [');
    expect(form).toContain("label: 'Project stage'");
    expect(form).toContain("label: 'Type of work'");
  });

  it('preserves the professional, the service and a draft through sign-in', () => {
    expect(form).toContain("params.get('professional')");
    expect(form).toContain("params.get('service')");
    expect(form).toContain('DRAFT_KEY');
    expect(form).toContain("p.set('resume', '1')");
    expect(form).toContain('/login?redirect=');
  });

  it('guards against double submission and shows the request reference', () => {
    expect(form).toContain('submittingRef.current');
    expect(form).toContain('disabled={submitting || !isCustomer}');
    expect(form).toContain('done.reference');
    expect(read('src/services/projectRequest/projectRequestService.ts')).toContain("'/api/project-requests'");
  });

  it('request-a-quote entry points open the new form, never the booking form', () => {
    expect(read('src/components/marketplace/ProfessionalResultCard.tsx')).toContain('/request-project?professional=');
    const profile = read('src/pages/PublicProfessionalProfilePage.tsx');
    expect(profile).toContain('/request-project?professional=');
    expect(profile).not.toContain('/book-service?');
    expect(read('src/pages/ServiceProfessionalsPage.tsx')).toContain('/request-project?service=');
  });

  it('customer accepts via the validated quotation states and is shown the created project', () => {
    const detail = read('src/pages/workspace/CustomerRequestDetailPage.tsx');
    expect(detail).toContain("updateStatus(q.id, 'VIEWED')");
    expect(detail).toContain("updateStatus(q.id, 'UNDER_REVIEW'");
    expect(detail).toContain("updateStatus(q.id, 'ACCEPTED'");
    expect(detail).toContain('busyRef.current');
    expect(detail).toContain('/projects/${projectId}');
  });

  it('professional pages use real APIs (no seeded sample data)', () => {
    for (const f of ['RequirementMarketplace', 'RequirementWorkspacePage', 'QuotationManagementPage']) {
      const src = read(`src/pages/workspace/professional/${f}.tsx`);
      expect(src).not.toMatch(/useState<[^>]+\[\]>\(\[\s*\{/); // no hard-coded initial records
    }
    expect(read('src/pages/workspace/professional/RequirementMarketplace.tsx')).toContain('projectRequestApi');
    const ws = read('src/pages/workspace/professional/RequirementWorkspacePage.tsx');
    expect(ws).toContain('quotationClientService.createQuotation');
    expect(ws).toContain("action(requestId, 'contact')");
  });
});
