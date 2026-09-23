import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileAdminWorkspaceService } from '../../mobile/src/services/mobileAdminWorkspaceService.js';
import {
  AdminHomeScreenController,
  renderAdminHomeScreen,
} from '../../mobile/src/screens/admin/AdminHomeScreen.js';
import {
  AdminUsersScreenController,
  renderAdminUsersScreen,
} from '../../mobile/src/screens/admin/AdminUsersScreen.js';
import {
  AdminUserDetailsScreenController,
  renderAdminUserDetailsScreen,
} from '../../mobile/src/screens/admin/AdminUserDetailsScreen.js';
import {
  AdminProfessionalsScreenController,
  renderAdminProfessionalsScreen,
} from '../../mobile/src/screens/admin/AdminProfessionalsScreen.js';
import {
  AdminRequestsScreenController,
  renderAdminRequestsScreen,
} from '../../mobile/src/screens/admin/AdminRequestsScreen.js';
import {
  AdminProjectsScreenController,
  renderAdminProjectsScreen,
} from '../../mobile/src/screens/admin/AdminProjectsScreen.js';
import {
  AdminAuditLogScreenController,
  renderAdminAuditLogScreen,
} from '../../mobile/src/screens/admin/AdminAuditLogScreen.js';
import {
  AdminProfileScreenController,
  renderAdminProfileScreen,
} from '../../mobile/src/screens/admin/AdminProfileScreen.js';
import { adminService } from '../../src/services/admin/adminService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';

vi.mock('../../src/services/admin/adminService.js', () => ({
  adminService: {
    getUsers: vi.fn(),
    updateUser: vi.fn(),
    getProviders: vi.fn(),
    verifyProvider: vi.fn(),
    getBookings: vi.fn(),
  },
}));

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    listProjects: vi.fn(),
  },
}));

describe('Module 45 — Admin Mobile Workspace & Platform Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileAdminWorkspaceService.clearCache();
  });

  describe('1. Mobile Admin Workspace Service', () => {
    it('loads platform users with role and search filtering', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com', role: 'customer', status: 'ACTIVE' },
          { id: 102, fullName: 'Sita Sharma', email: 'sita.sharma@example.com', role: 'customer', status: 'ACTIVE' },
          { id: 103, fullName: 'Venkatesh Rao', email: 'venkatesh.rao@contractor.in', role: 'contractor', status: 'PENDING' },
          { id: 104, fullName: 'Admin User', email: 'admin@dbc.in', role: 'admin', status: 'ACTIVE' },
        ],
      });

      const users = await mobileAdminWorkspaceService.getUsers();
      expect(users.length).toBe(4);

      const customers = await mobileAdminWorkspaceService.getUsers({ role: 'customer' });
      expect(customers.length).toBe(2);

      const searched = await mobileAdminWorkspaceService.getUsers({ search: 'Venkatesh' });
      expect(searched.length).toBe(1);
      expect(searched[0].fullName).toBe('Venkatesh Rao');
    });

    it('fetches specific user details by ID', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com', role: 'customer', status: 'ACTIVE' },
        ],
      });

      const user = await mobileAdminWorkspaceService.getUserDetails('101');
      expect(user.id).toBe('101');
      expect(user.fullName).toBe('Ramesh Kumar');
    });

    it('updates user status and logs audit event', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com', role: 'customer', status: 'ACTIVE' },
        ],
      });
      vi.mocked(adminService.updateUser).mockResolvedValue({ success: true });

      const updated = await mobileAdminWorkspaceService.updateUserStatus('101', 'SUSPENDED');
      expect(updated.status).toBe('SUSPENDED');

      const logs = await mobileAdminWorkspaceService.getAuditLogs();
      expect(logs.some((l) => l.action === 'UPDATE_USER_STATUS')).toBe(true);
    });

    it('loads trade partners with verification filtering', async () => {
      vi.mocked(adminService.getProviders).mockResolvedValue({
        data: [
          {
            id: 201,
            businessName: 'Apex Civil Structures',
            contactPerson: 'Venkatesh Rao',
            email: 'venkatesh@apexcivil.in',
            verificationStatus: 'VERIFIED',
          },
          {
            id: 202,
            businessName: 'Precision MEP Systems',
            contactPerson: 'Srinivas Reddy',
            email: 'srinivas@mep.in',
            verificationStatus: 'PENDING',
          },
        ],
      });

      const providers = await mobileAdminWorkspaceService.getProfessionals();
      expect(providers.length).toBe(2);

      const pending = await mobileAdminWorkspaceService.getProfessionals({ verificationStatus: 'PENDING' });
      expect(pending.length).toBe(1);
      expect(pending[0].businessName).toBe('Precision MEP Systems');
    });

    it('verifies professional credentials and updates status', async () => {
      vi.mocked(adminService.getProviders).mockResolvedValue({
        data: [
          {
            id: 202,
            businessName: 'Precision MEP Systems',
            contactPerson: 'Srinivas Reddy',
            verificationStatus: 'PENDING',
          },
        ],
      });
      vi.mocked(adminService.verifyProvider).mockResolvedValue({ success: true });

      const verified = await mobileAdminWorkspaceService.verifyProfessional('202', 'VERIFIED');
      expect(verified.verificationStatus).toBe('VERIFIED');

      const logs = await mobileAdminWorkspaceService.getAuditLogs();
      expect(logs.some((l) => l.action === 'VERIFY_PROVIDER')).toBe(true);
    });

    it('fetches platform requests and projects', async () => {
      vi.mocked(adminService.getBookings).mockResolvedValue({
        data: [
          {
            id: 301,
            bookingNumber: 'REQ-301',
            customerName: 'Ramesh Kumar',
            serviceCategory: 'Civil Masonry',
            bookingStatus: 'REQUESTED',
            estimatedAmount: 120000,
          },
        ],
      });

      vi.mocked(ProjectService.listProjects).mockResolvedValue([
        {
          id: 'proj-301',
          status: 'IN_PROGRESS',
          createdAt: '2026-08-01T10:00:00Z',
          customer: { fullName: 'Ramesh Kumar' },
          provider: { businessName: 'Apex Civil Structures' },
          requirement: { title: 'Villa Foundation' },
          quotation: { totalAmount: 120000 },
          milestones: [{ id: 'm-1', status: 'APPROVED' }, { id: 'm-2', status: 'PENDING' }],
        },
      ] as any);

      const requests = await mobileAdminWorkspaceService.getAdminRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].bookingNumber).toBe('REQ-301');

      const projects = await mobileAdminWorkspaceService.getAdminProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].progressPercentage).toBe(50);
    });

    it('builds operational dashboard overview with pending action items', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Customer 1', role: 'customer', status: 'ACTIVE' },
          { id: 102, fullName: 'Contractor 1', role: 'contractor', status: 'PENDING' },
        ],
      });
      vi.mocked(adminService.getProviders).mockResolvedValue({
        data: [
          { id: 201, businessName: 'Pending Trade Partner', verificationStatus: 'PENDING' },
        ],
      });

      const overview = await mobileAdminWorkspaceService.getAdminDashboardOverview();
      expect(overview.metrics.totalUsersCount).toBe(2);
      expect(overview.metrics.pendingVerificationsCount).toBe(1);
      expect(overview.actionItems.length).toBeGreaterThan(0);
      expect(overview.actionItems[0].title).toContain('Pending Provider Verification');
    });

    it('handles 401 and 403 errors appropriately', async () => {
      vi.mocked(adminService.getUsers).mockRejectedValue(new Error('401 Unauthorized'));

      await expect(mobileAdminWorkspaceService.getUsers()).rejects.toThrow('UNAUTHORIZED_EXPIRED_SESSION');

      vi.mocked(adminService.getUsers).mockRejectedValue(new Error('403 Access denied'));
      await expect(mobileAdminWorkspaceService.getUsers()).rejects.toThrow('ACCESS_DENIED_ADMIN');
    });
  });

  describe('2. Admin Mobile Screen Controllers & HTML Renderers', () => {
    it('initializes and renders AdminHomeScreen', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({ data: [] });
      vi.mocked(adminService.getProviders).mockResolvedValue({ data: [] });

      const controller = new AdminHomeScreenController({});
      await controller.init();

      const html = renderAdminHomeScreen(controller);
      expect(html).toContain('Platform Operations Console');
      expect(html).toContain('SUPER ADMIN');
    });

    it('initializes and renders AdminUsersScreen with filter controls', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Ramesh Kumar', email: 'ramesh@example.com', role: 'customer', status: 'ACTIVE' },
        ],
      });

      const controller = new AdminUsersScreenController({});
      await controller.init();

      let html = renderAdminUsersScreen(controller);
      expect(html).toContain('Ramesh Kumar');
      expect(html).toContain('Platform Users');

      controller.setRoleFilter('contractor');
      await controller.loadUsers();
      html = renderAdminUsersScreen(controller);
      expect(html).toContain('User Directory');
    });

    it('initializes and renders AdminUserDetailsScreen with status change trigger', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({
        data: [
          { id: 101, fullName: 'Ramesh Kumar', email: 'ramesh@example.com', role: 'customer', status: 'ACTIVE' },
        ],
      });

      const controller = new AdminUserDetailsScreenController({ userId: '101' });
      await controller.init();

      let html = renderAdminUserDetailsScreen(controller);
      expect(html).toContain('Ramesh Kumar');
      expect(html).toContain('Suspend Account');

      controller.promptStatusChange('SUSPENDED');
      html = renderAdminUserDetailsScreen(controller);
      expect(html).toContain('Confirm Account Action');

      vi.mocked(adminService.updateUser).mockResolvedValue({ success: true });
      await controller.confirmStatusChange();
      html = renderAdminUserDetailsScreen(controller);
      expect(html).toContain('User status updated to SUSPENDED');
    });

    it('initializes and renders AdminProfessionalsScreen with verification modal', async () => {
      vi.mocked(adminService.getProviders).mockResolvedValue({
        data: [
          { id: 201, businessName: 'Apex Civil Structures', contactPerson: 'Venkatesh', verificationStatus: 'PENDING' },
        ],
      });

      const controller = new AdminProfessionalsScreenController({});
      await controller.init();

      let html = renderAdminProfessionalsScreen(controller);
      expect(html).toContain('Apex Civil Structures');
      expect(html).toContain('Approve Credentials');

      controller.openVerifyModal(controller.getState().professionals[0], 'VERIFIED');
      html = renderAdminProfessionalsScreen(controller);
      expect(html).toContain('Confirm Verification Action');

      vi.mocked(adminService.verifyProvider).mockResolvedValue({ success: true });
      await controller.confirmVerification();
      html = renderAdminProfessionalsScreen(controller);
      expect(html).toContain('Provider verification status set to VERIFIED');
    });

    it('initializes and renders AdminRequestsScreen', async () => {
      vi.mocked(adminService.getBookings).mockResolvedValue({
        data: [
          { id: 301, bookingNumber: 'REQ-301', customerName: 'Ramesh Kumar', serviceCategory: 'Civil Masonry', bookingStatus: 'REQUESTED' },
        ],
      });

      const controller = new AdminRequestsScreenController({});
      await controller.init();

      const html = renderAdminRequestsScreen(controller);
      expect(html).toContain('Project Requests');
      expect(html).toContain('REQ-301');
    });

    it('initializes and renders AdminProjectsScreen', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([
        {
          id: 'proj-301',
          status: 'IN_PROGRESS',
          createdAt: '2026-08-01T10:00:00Z',
          customer: { fullName: 'Ramesh Kumar' },
          provider: { businessName: 'Apex Civil Structures' },
          requirement: { title: 'Jubilee Hills Raft Foundation' },
          quotation: { totalAmount: 120000 },
          milestones: [{ id: 'm-1', status: 'APPROVED' }],
        },
      ] as any);

      const controller = new AdminProjectsScreenController({});
      await controller.init();

      const html = renderAdminProjectsScreen(controller);
      expect(html).toContain('Platform Projects');
      expect(html).toContain('Jubilee Hills Raft Foundation');
    });

    it('initializes and renders AdminAuditLogScreen', async () => {
      const controller = new AdminAuditLogScreenController({});
      await controller.init();

      const html = renderAdminAuditLogScreen(controller);
      expect(html).toContain('Platform Audit Logs');
    });

    it('renders AdminProfileScreen and handles clearing cache', async () => {
      const controller = new AdminProfileScreenController({});
      let html = renderAdminProfileScreen(controller);

      expect(html).toContain('admin@dbc.in');
      expect(html).toContain('Super Platform Administrator');
      expect(html).toContain('Clear Local Admin Cache');

      await controller.clearAdminCache();
      html = renderAdminProfileScreen(controller);
      expect(html).toContain('Platform local admin cache successfully cleared');
    });
  });
});
