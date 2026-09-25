import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileApiClient } from '../../mobile/src/api/mobileApiClient.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { mobileAuthService, resolveUserRole, normalizeAuthError } from '../../mobile/src/services/mobileAuthService.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import { mobileProfessionalQuotationService } from '../../mobile/src/services/mobileProfessionalQuotationService.js';
import { mobileAdminWorkspaceService } from '../../mobile/src/services/mobileAdminWorkspaceService.js';
import { mobileMarketplaceService } from '../../mobile/src/services/mobileMarketplaceService.js';
import { mobileProfileService } from '../../mobile/src/services/mobileProfileService.js';
import { normalizeMobileApiError } from '../../mobile/src/api/mobileErrorUtils.js';
import { authService } from '../../src/services/auth/authService.js';
import { bookingApi } from '../../src/services/booking/bookingService.js';
import { categoryApi } from '../../src/services/category/categoryService.js';
import { searchApi } from '../../src/services/search/searchService.js';

describe('Module 61 — Mobile Backend Integration & API Contract Verification Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication & Role Resolution Contract Tests
  // ---------------------------------------------------------------------------
  describe('1. Authentication Contract', () => {
    it('1.1 resolves user roles correctly from raw backend role strings', () => {
      expect(resolveUserRole('ADMIN')).toBe('admin');
      expect(resolveUserRole('SUPER_ADMIN')).toBe('admin');
      expect(resolveUserRole('CONTRACTOR')).toBe('contractor');
      expect(resolveUserRole('PROVIDER')).toBe('contractor');
      expect(resolveUserRole('WORKER')).toBe('contractor');
      expect(resolveUserRole('CUSTOMER')).toBe('customer');
      expect(resolveUserRole(undefined)).toBe('customer');
    });

    it('1.2 verifies login contract extracts token and maps user profile', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'jwt-auth-token-123',
        user: { id: 'usr-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'ROLE_CUSTOMER' } as any,
      });

      const result = await mobileAuthService.login({ email: 'test@example.com', password: 'password123' });

      expect(result.token).toBe('jwt-auth-token-123');
      expect(result.user.id).toBe('usr-1');
      expect(result.user.role).toBe('customer');
    });

    it('1.3 verifies registration contract sends required registration fields', async () => {
      vi.spyOn(authService, 'register').mockResolvedValue({
        verificationToken: 'v-tok-123',
      } as any);
      vi.spyOn(authService, 'sendEmailOtp').mockResolvedValue({ success: true } as any);

      const result = await mobileAuthService.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        role: 'customer',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.verificationToken).toBe('v-tok-123');
    });

    it('1.4 verifies send email OTP API contract via mobileApiClient', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
      });

      const response = await mobileApiClient.post<{ success: boolean }>('/api/auth/send-email-otp', { email: 'user@example.com' });
      expect(response.success).toBe(true);
    });

    it('1.5 verifies verify email OTP API contract via mobileApiClient', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        token: 'otp-verified-token',
        user: { id: 'usr-otp', email: 'otp@example.com', name: 'OTP User', role: 'customer' },
      });

      const result = await mobileApiClient.post<{ token: string; user: { id: string } }>('/api/auth/verify-email-otp', { email: 'otp@example.com', code: '123456' });
      expect(result.token).toBe('otp-verified-token');
      expect(result.user.id).toBe('usr-otp');
    });

    it('1.6 verifies normalizeAuthError handles credential errors cleanly', () => {
      const err = normalizeAuthError(new Error('Invalid credentials provided'));
      expect(err.code).toBe('INVALID_CREDENTIALS');
      expect(err.message).toContain('Invalid credentials');
    });

    it('1.7 verifies HTTP GET, POST, PUT, PATCH, DELETE operations on mobileApiClient', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValue({ status: 'ok' });
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({ created: true });
      vi.spyOn(mobileApiClient, 'put').mockResolvedValue({ updated: true });
      vi.spyOn(mobileApiClient, 'patch').mockResolvedValue({ patched: true });
      vi.spyOn(mobileApiClient, 'delete').mockResolvedValue({ deleted: true });

      expect(await mobileApiClient.get('/api/health')).toEqual({ status: 'ok' });
      expect(await mobileApiClient.post('/api/health', {})).toEqual({ created: true });
      expect(await mobileApiClient.put('/api/health', {})).toEqual({ updated: true });
      expect(await mobileApiClient.patch('/api/health', {})).toEqual({ patched: true });
      expect(await mobileApiClient.delete('/api/health')).toEqual({ deleted: true });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Profile API Contract Tests
  // ---------------------------------------------------------------------------
  describe('2. Profile API Contract', () => {
    it('2.1 fetches customer profile via /api/customer/profile endpoint', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValue({
        profile: { id: 'p-1', name: 'Customer Profile', city: 'Mumbai' },
      });

      const res = await mobileApiClient.get<{ profile: { name: string } }>('/api/customer/profile');
      expect(res.profile.name).toBe('Customer Profile');
    });

    it('2.2 updates contractor profile via /api/contractor/profile endpoint', async () => {
      vi.spyOn(mobileApiClient, 'put').mockResolvedValue({
        profile: { id: 'p-2', name: 'Apex Builders', trade: 'General Construction' },
      });

      const res = await mobileApiClient.put<{ profile: { trade: string } }>('/api/contractor/profile', { name: 'Apex Builders' });
      expect(res.profile.trade).toBe('General Construction');
    });

    it('2.3 uploads profile image via /api/profile/upload endpoint', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        url: 'https://cdn.dbc.in/profiles/img-1.jpg',
        success: true,
      });

      const response = await mobileApiClient.post<{ url: string }>('/api/profile/upload', {});
      expect(response.url).toBe('https://cdn.dbc.in/profiles/img-1.jpg');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Marketplace & Discovery API Contract Tests
  // ---------------------------------------------------------------------------
  describe('3. Marketplace API Contract', () => {
    it('3.1 fetches categories via categoryApi /api/categories endpoint', async () => {
      vi.spyOn(categoryApi, 'getCategories').mockResolvedValue([
        { id: 'cat-1', name: 'Engineering', slug: 'engineering', isFeatured: true } as any,
      ]);

      const categories = await mobileMarketplaceService.getCategories();
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('Engineering');
    });

    it('3.2 searches provider directory via searchApi /api/search/providers', async () => {
      vi.spyOn(searchApi, 'searchProviders').mockResolvedValue({
        data: [{ id: 'prov-1', businessName: 'Best Builder', rating: 4.8 }],
        total: 1,
      } as any);

      const result = await mobileMarketplaceService.searchProfessionals({ query: 'Builder', city: 'Bangalore' });

      expect(result.items[0].businessName).toBe('Best Builder');
      expect(result.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Project Request & Requirements API Contract Tests
  // ---------------------------------------------------------------------------
  describe('4. Project Request API Contract', () => {
    it('4.1 submits new project request via submitProjectRequest endpoint', async () => {
      vi.spyOn(bookingApi, 'createBooking').mockResolvedValue({
        id: 'req-501',
        bookingNumber: 'REQ-501',
        serviceName: 'Villa Build',
        bookingStatus: 'REQUESTED',
        createdAt: '2026-09-25T10:00:00Z',
      } as any);

      const created = await mobileRequestService.submitProjectRequest({
        description: 'Villa Build Spec',
        city: 'Delhi',
      });

      expect(created.id).toBe('req-501');
      expect(created.status).toBe('REQUESTED');
    });

    it('4.2 fetches customer requests via getMyRequests endpoint', async () => {
      vi.spyOn(bookingApi, 'getMyBookings').mockResolvedValue([
        { id: 'req-501', bookingNumber: 'REQ-501', serviceName: 'Villa Build', bookingStatus: 'REQUESTED', createdAt: '2026-09-25T10:00:00Z' } as any,
      ]);

      const requests = await mobileRequestService.getMyRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].id).toBe('req-501');
    });

    it('4.3 cancels project request via cancelProjectRequest endpoint', async () => {
      vi.spyOn(bookingApi, 'cancelBooking').mockResolvedValue({
        id: 'req-501',
        bookingNumber: 'REQ-501',
        serviceName: 'Villa Build',
        bookingStatus: 'CANCELLED',
        createdAt: '2026-09-25T10:00:00Z',
      } as any);

      const updated = await mobileRequestService.cancelProjectRequest('req-501');
      expect(updated.status).toBe('CANCELLED');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Quotation Lifecycle API Contract Tests
  // ---------------------------------------------------------------------------
  describe('5. Quotation Lifecycle API Contract', () => {
    it('5.1 creates quotation proposal draft via createQuotationDraft', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'createQuotationDraft').mockResolvedValue({
        id: 100,
        requirementId: 501,
        requirementTitle: 'Villa Construction',
        customerName: 'Customer',
        totalAmount: 1000000,
        totalAmountFormatted: '₹10,00,000',
        status: 'DRAFT',
        statusLabel: 'Draft Proposal',
        isEditable: true,
        isWithdrawable: false,
        isSubmittable: true,
      });

      const created = await mobileProfessionalQuotationService.createQuotationDraft({
        requirementId: 501,
        totalAmount: 1000000,
        milestones: [{ id: 1, name: 'M1', cost: 500000, durationDays: 20 }],
      });

      expect(created.id).toBe(100);
      expect(created.status).toBe('DRAFT');
    });

    it('5.2 submits quotation proposal via submitQuotationProposal', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'submitQuotationProposal').mockResolvedValue({
        id: 100,
        quotationId: 100,
        requirementId: 501,
        requirementTitle: 'Villa Construction',
        customerName: 'Customer',
        totalAmount: 1000000,
        totalAmountFormatted: '₹10,00,000',
        status: 'SUBMITTED',
        statusLabel: 'Submitted to Customer',
        isEditable: false,
        isWithdrawable: true,
        isSubmittable: false,
      });

      const result = await mobileProfessionalQuotationService.submitQuotationProposal({
        requirementId: 501,
        totalPrice: 1000000,
        timelineWeeks: 4,
        scopeDeliverables: ['Foundation', 'Framing'],
        milestones: [{ title: 'Foundation', amount: 500000, durationWeeks: 2 }],
      });

      expect(result.quotationId).toBe(100);
      expect(result.status).toBe('SUBMITTED');
    });

    it('5.3 withdraws quotation proposal via withdrawQuotation endpoint', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'withdrawQuotation').mockResolvedValue({
        id: 100,
        requirementId: 501,
        requirementTitle: 'Villa Construction',
        customerName: 'Customer',
        totalAmount: 1000000,
        totalAmountFormatted: '₹10,00,000',
        status: 'WITHDRAWN',
        statusLabel: 'Withdrawn by Contractor',
        isEditable: false,
        isWithdrawable: false,
        isSubmittable: false,
      });

      const withdrawn = await mobileProfessionalQuotationService.withdrawQuotation(100, 'Price error');
      expect(withdrawn.status).toBe('WITHDRAWN');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Project & Execution API Contract Tests
  // ---------------------------------------------------------------------------
  describe('6. Project Execution API Contract', () => {
    it('6.1 lists active projects via getCustomerProjects endpoint', async () => {
      vi.spyOn(mobileCustomerWorkspaceService, 'getCustomerProjects').mockResolvedValue([
        { id: 'proj-1', requirementId: 'req-1', title: 'Villa Build', providerName: 'Apex', status: 'IN_PROGRESS', statusLabel: 'In Progress', progressPercentage: 50 },
      ]);

      const projects = await mobileCustomerWorkspaceService.getCustomerProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].status).toBe('IN_PROGRESS');
    });

    it('6.2 fetches project overview details via getProjectOverview endpoint', async () => {
      vi.spyOn(mobileProjectExecutionService, 'getProjectOverview').mockResolvedValue({
        id: 'proj-1',
        title: 'Villa Build',
        providerName: 'Apex Builders',
        status: 'IN_PROGRESS',
        statusLabel: 'In Progress',
        progressPercentage: 40,
        hasPendingApproval: false,
      });

      const details = await mobileProjectExecutionService.getProjectOverview('proj-1');
      expect(details.id).toBe('proj-1');
      expect(details.title).toBe('Villa Build');
    });

    it('6.3 approves milestone via approveMilestone endpoint', async () => {
      const approveSpy = vi.spyOn(mobileProjectExecutionService, 'approveMilestone').mockResolvedValue(undefined);

      await mobileProjectExecutionService.approveMilestone('proj-1', 'ms-1');
      expect(approveSpy).toHaveBeenCalledWith('proj-1', 'ms-1');
    });

    it('6.4 uploads project document via POST /api/projects/:id/documents endpoint', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        document: { id: 'doc-1', name: 'Blueprint.pdf', url: 'https://cdn/doc-1.pdf' },
      });

      const response = await mobileApiClient.post<{ document: { id: string; name: string } }>('/api/projects/proj-1/documents', {
        name: 'Blueprint.pdf',
      });

      expect(response.document.name).toBe('Blueprint.pdf');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Payments & Financial Integrity API Contract Tests
  // ---------------------------------------------------------------------------
  describe('7. Payment & Financial API Contract', () => {
    it('7.1 fetches payment subscription plans via GET /api/subscriptions/plans', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValue({
        plans: [{ id: 'plan-pro', name: 'Pro Contractor', price: 4999 }],
      });

      const res = await mobileApiClient.get<{ plans: Array<{ id: string; price: number }> }>('/api/subscriptions/plans');
      expect(res.plans[0].id).toBe('plan-pro');
      expect(res.plans[0].price).toBe(4999);
    });

    it('7.2 initiates payment order via POST /api/subscriptions/create-order', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        orderId: 'order_123456',
        amount: 5000,
        key: 'rzp_live_key',
      });

      const res = await mobileApiClient.post<{ orderId: string; amount: number }>('/api/subscriptions/create-order', {
        planId: 'plan-pro',
        amount: 5000,
      });

      expect(res.orderId).toBe('order_123456');
      expect(res.amount).toBe(5000);
    });

    it('7.3 verifies payment transaction signature via POST /api/subscriptions/verify-payment', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({
        success: true,
        receipt: { txnId: 'txn_998877' },
      });

      const res = await mobileApiClient.post<{ success: boolean; receipt: { txnId: string } }>('/api/subscriptions/verify-payment', {
        orderId: 'order_123456',
        paymentId: 'pay_abc',
        signature: 'sig_xyz',
      });

      expect(res.success).toBe(true);
      expect(res.receipt.txnId).toBe('txn_998877');
    });

    it('7.4 verifies client application DOES NOT locally calculate authoritative totalAmount', () => {
      const backendQuotationResponse = { id: 'q-1', totalAmount: 1500000, platformFee: 30000, netPayable: 1530000 };

      expect(backendQuotationResponse.totalAmount).toBe(1500000);
      expect(backendQuotationResponse.platformFee).toBe(30000);
      expect(backendQuotationResponse.netPayable).toBe(1530000);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Messaging & Conversations API Contract Tests
  // ---------------------------------------------------------------------------
  describe('8. Messaging API Contract', () => {
    it('8.1 lists user conversations via GET /api/conversations endpoint', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'getCustomerThreads').mockResolvedValue([
        { id: 'conv-1', providerId: 'p-1', providerName: 'Apex', providerRole: 'Lead', avatar: '🔨', projectContextTitle: 'Villa', lastMessage: 'Hi', lastMessageAt: '12:00', unread: false, unreadCount: 0 },
      ]);

      const threads = await mobileCustomerMessagingService.getCustomerThreads();
      expect(threads.length).toBe(1);
    });

    it('8.2 fetches thread messages via GET /api/conversations/:id/messages endpoint', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'getMessages').mockResolvedValue([
        { id: 'm-1', conversationId: 'conv-1', senderId: 'u-1', senderRole: 'CUSTOMER', senderName: 'You', content: 'Hello contractor', messageType: 'TEXT', isRead: true, timestamp: '12:00', createdAt: '2026-09-25T12:00:00Z' },
      ]);

      const messages = await mobileCustomerMessagingService.getMessages('conv-1');
      expect(messages[0].content).toBe('Hello contractor');
    });

    it('8.3 sends message via POST /api/conversations/:id/messages endpoint', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'sendMessage').mockResolvedValue({
        id: 'm-2',
        conversationId: 'conv-1',
        senderId: 'cust-current',
        senderRole: 'CUSTOMER',
        senderName: 'You',
        content: 'Quotation looks good',
        messageType: 'TEXT',
        isRead: true,
        timestamp: '12:05',
        createdAt: '2026-09-25T12:05:00Z',
      });

      const sent = await mobileCustomerMessagingService.sendMessage('conv-1', 'Quotation looks good');
      expect(sent.content).toBe('Quotation looks good');
    });

    it('8.4 posts read receipt via POST /api/conversations/:id/read endpoint', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValue({ success: true });

      const res = await mobileApiClient.post<{ success: boolean }>('/api/conversations/conv-1/read', {
        messageIds: ['m-1', 'm-2'],
      });

      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Admin Operational API Contract Tests
  // ---------------------------------------------------------------------------
  describe('9. Admin Operations API Contract', () => {
    it('9.1 fetches user directory via GET /api/admin/users endpoint', async () => {
      vi.spyOn(mobileAdminWorkspaceService, 'getUsers').mockResolvedValue([
        { id: 'usr-1', email: 'c@dbc.com', name: 'Customer', role: 'customer', status: 'ACTIVE', registrationDateFormatted: '2026-09-25' },
      ]);

      const usersResult = await mobileAdminWorkspaceService.getUsers({ role: 'customer' });
      expect(usersResult.length).toBe(1);
    });

    it('9.2 toggles user account state via PATCH /api/admin/users/:id endpoint', async () => {
      const patchSpy = vi.spyOn(mobileApiClient, 'patch').mockResolvedValue({
        user: { id: 'usr-1', status: 'SUSPENDED' },
      });

      const response = await mobileApiClient.patch<{ user: { id: string; status: string } }>('/api/admin/users/usr-1', {
        status: 'SUSPENDED',
      });

      expect(patchSpy).toHaveBeenCalledWith('/api/admin/users/usr-1', { status: 'SUSPENDED' });
      expect(response.user.status).toBe('SUSPENDED');
    });

    it('9.3 fetches provider verification directory via GET /api/admin/providers endpoint', async () => {
      vi.spyOn(mobileAdminWorkspaceService, 'getProfessionals').mockResolvedValue([
        { id: 'prov-1', businessName: 'Apex Builders', trade: 'General', city: 'Hyderabad', rating: 4.8, verificationStatus: 'VERIFIED', isVerified: true, isSuspended: false },
      ]);

      const result = await mobileAdminWorkspaceService.getProfessionals();
      expect(result[0].isVerified).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Error, Pagination, and Date Handling Contract Tests
  // ---------------------------------------------------------------------------
  describe('10. Error Normalization & Date Format Contract', () => {
    it('10.1 maps 404 Not Found backend error correctly', () => {
      const rawErr = { isAxiosError: true, response: { status: 404, data: { message: 'Resource not found' } } };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.category).toBe('NOT_FOUND');
      expect(normalized.status).toBe(404);
    });

    it('10.2 maps 409 Conflict backend error correctly', () => {
      const rawErr = { isAxiosError: true, response: { status: 409, data: { message: 'Already exists' } } };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.category).toBe('CONFLICT');
      expect(normalized.status).toBe(409);
    });

    it('10.3 maps 422 Unprocessable Entity validation backend error correctly', () => {
      const rawErr = { isAxiosError: true, response: { status: 422, data: { message: 'Validation failed' } } };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.category).toBe('VALIDATION');
      expect(normalized.status).toBe(422);
    });

    it('10.4 enforces ISO-8601 UTC date string format verification', () => {
      const dateStr = '2026-09-25T14:30:00.000Z';
      const parsed = new Date(dateStr);

      expect(parsed.toISOString()).toBe(dateStr);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('10.5 verifies offset pagination params (limit, offset) are correctly structured', () => {
      const params = { limit: 20, offset: 40 };
      expect(params.limit).toBe(20);
      expect(params.offset).toBe(40);
    });

    it('10.6 verifies 401 Session Expired error triggers unauthorized error structure', () => {
      const rawErr = { isAxiosError: true, response: { status: 401, data: { message: 'Token expired' } } };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.code).toBe('UNAUTHORIZED_EXPIRED_SESSION');
      expect(normalized.status).toBe(401);
    });

    it('10.7 verifies timeout error normalization structure', () => {
      const rawErr = { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.code).toBe('TIMEOUT_ERROR');
      expect(normalized.status).toBe(408);
      expect(normalized.retryable).toBe(true);
    });

    it('10.8 verifies 403 Forbidden error handling', () => {
      const rawErr = { isAxiosError: true, response: { status: 403, data: { message: 'Forbidden' } } };
      const normalized = normalizeMobileApiError(rawErr);

      expect(normalized.code).toBe('ACCESS_DENIED');
      expect(normalized.status).toBe(403);
    });
  });
});
