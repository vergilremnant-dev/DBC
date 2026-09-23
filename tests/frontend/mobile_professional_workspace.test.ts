import { describe, it, expect, beforeEach, vi } from 'vitest';
import { determineInitialNavigationStack } from '../../mobile/src/navigation/rootNavigation.js';
import { mobileProfessionalWorkspaceService } from '../../mobile/src/services/mobileProfessionalWorkspaceService.js';
import {
  ProfessionalHomeScreenController,
  renderProfessionalHomeScreen,
} from '../../mobile/src/screens/workspace/ProfessionalHomeScreen.js';
import {
  ProfessionalRequestsScreenController,
  renderProfessionalRequestsScreen,
} from '../../mobile/src/screens/request/ProfessionalRequestsScreen.js';
import {
  ProfessionalRequestDetailsScreenController,
  renderProfessionalRequestDetailsScreen,
} from '../../mobile/src/screens/request/ProfessionalRequestDetailsScreen.js';
import {
  ProfessionalLeadsScreenController,
  renderProfessionalLeadsScreen,
} from '../../mobile/src/screens/marketplace/ProfessionalLeadsScreen.js';
import {
  ProfessionalProjectsScreenController,
  renderProfessionalProjectsScreen,
} from '../../mobile/src/screens/workspace/ProfessionalProjectsScreen.js';
import { bookingApi } from '../../src/services/booking/bookingService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import type { Booking } from '../../src/types/booking/bookingTypes.js';

vi.mock('../../src/services/booking/bookingService.js', () => ({
  bookingApi: {
    getProviderBookings: vi.fn(),
    getBookingDetails: vi.fn(),
    acceptBooking: vi.fn(),
    rejectBooking: vi.fn(),
  },
}));

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    getProjectDetail: vi.fn(),
  },
}));

const mockBookings: Booking[] = [
  {
    id: 'b-101',
    bookingNumber: 'REQ-101',
    customerId: 'cust-101',
    customerName: 'Ramesh Kumar',
    customerPhone: '+91 98765 43210',
    serviceCategory: 'Civil Masonry & Foundation',
    bookingStatus: 'REQUESTED',
    estimatedAmount: 120000,
    preferredDate: '2026-10-01',
    notes: 'Raft slab foundation excavation required.',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'b-102',
    bookingNumber: 'REQ-102',
    customerId: 'cust-102',
    customerName: 'Sita Sharma',
    serviceCategory: 'MEP Electrical Conduits',
    bookingStatus: 'ACCEPTED',
    estimatedAmount: 45000,
    preferredDate: '2026-10-05',
    notes: 'Penthouse electrical conduits chasing.',
    createdAt: '2026-09-18T10:00:00Z',
  },
];

describe('Module 41 — Professional Mobile Workspace Foundation & Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileProfessionalWorkspaceService.clearCache();
  });

  describe('1. Role Protection & Navigation Guard', () => {
    it('redirects unauthenticated users to Public stack', () => {
      const initial = determineInitialNavigationStack({ status: 'unauthenticated', user: null, pendingTarget: null });
      expect(initial).toBe('Public');
    });

    it('routes Customer users to CustomerTab stack', () => {
      const initial = determineInitialNavigationStack({
        status: 'authenticated',
        user: { id: 'u1', email: 'c@test.com', role: 'customer' },
        pendingTarget: null,
      });
      expect(initial).toBe('CustomerTab');
    });

    it('routes Professional (contractor) users to ProfessionalTab stack', () => {
      const initial = determineInitialNavigationStack({
        status: 'authenticated',
        user: { id: 'u2', email: 'p@test.com', role: 'contractor' },
        pendingTarget: null,
      });
      expect(initial).toBe('ProfessionalTab');
    });
  });

  describe('2. Professional Home Dashboard', () => {
    it('loads metrics, action items, active builds, and recent requests', async () => {
      vi.mocked(bookingApi.getProviderBookings).mockResolvedValue(mockBookings);
      vi.mocked(ProjectService.listProjects).mockResolvedValue([]);

      const overview = await mobileProfessionalWorkspaceService.getProfessionalDashboardOverview();

      expect(overview.metrics.pendingRequestsCount).toBe(1);
      expect(overview.actionItems.length).toBeGreaterThan(0);
      expect(overview.recentRequests.length).toBe(2);

      const controller = new ProfessionalHomeScreenController({});
      await controller.init();

      expect(controller.getState().isLoading).toBe(false);
      const html = renderProfessionalHomeScreen(controller);
      expect(html).toContain('Trade Partner Workspace');
      expect(html).toContain('Civil Masonry & Foundation');
    });
  });

  describe('3. Professional Requests & Details Workflow', () => {
    it('loads requests and filters by status', async () => {
      vi.mocked(bookingApi.getProviderBookings).mockResolvedValue(mockBookings);

      const controller = new ProfessionalRequestsScreenController({});
      await controller.init();

      expect(controller.getState().requests.length).toBe(2);

      controller.setFilter('PENDING');
      const html = renderProfessionalRequestsScreen(controller);
      expect(html).toContain('REQ-101');
    });

    it('handles Request Details, Accept action, and exposes Prepare Quotation CTA', async () => {
      vi.mocked(bookingApi.getBookingDetails).mockResolvedValue(mockBookings[0]);
      vi.mocked(bookingApi.acceptBooking).mockResolvedValue({ ...mockBookings[0], bookingStatus: 'ACCEPTED' });

      const controller = new ProfessionalRequestDetailsScreenController({ requestId: 'b-101' });
      await controller.init();

      expect(controller.getState().request?.isActionable).toBe(true);

      await controller.handleAccept();

      expect(bookingApi.acceptBooking).toHaveBeenCalledWith('b-101');
      expect(controller.getState().request?.status).toBe('ACCEPTED');
      expect(controller.getState().statusMessage).toContain('accepted successfully');

      const html = renderProfessionalRequestDetailsScreen(controller);
      expect(html).toContain('Prepare Commercial Quotation');
    });

    it('handles Request Decline action with reason modal', async () => {
      vi.mocked(bookingApi.getBookingDetails).mockResolvedValue(mockBookings[0]);
      vi.mocked(bookingApi.rejectBooking).mockResolvedValue({ ...mockBookings[0], bookingStatus: 'REJECTED' });

      const controller = new ProfessionalRequestDetailsScreenController({ requestId: 'b-101' });
      await controller.init();

      controller.openDeclineModal();
      expect(controller.getState().isDeclineModalOpen).toBe(true);

      controller.setDeclineReason('Schedule capacity full');
      await controller.handleDecline();

      expect(bookingApi.rejectBooking).toHaveBeenCalledWith('b-101');
      expect(controller.getState().request?.status).toBe('REJECTED');
    });
  });

  describe('4. Leads & Projects Exploration', () => {
    it('loads open leads and handles express interest action', async () => {
      const controller = new ProfessionalLeadsScreenController({});
      await controller.init();

      expect(controller.getState().leads.length).toBeGreaterThan(0);

      controller.expressInterest('lead-601');
      expect(controller.getState().actionMessage).toContain('Interest expressed');

      const html = renderProfessionalLeadsScreen(controller);
      expect(html).toContain('500 Sq Yd Raft Excavation');
    });

    it('loads active contractor projects portfolio', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([]);

      const controller = new ProfessionalProjectsScreenController({});
      await controller.init();

      expect(controller.getState().projects.length).toBeGreaterThan(0);

      const html = renderProfessionalProjectsScreen(controller);
      expect(html).toContain('Contractor Builds & Projects');
      expect(html).toContain('Jubilee Hills Villa Foundation');
    });
  });

  describe('5. Security & Authorization Error Handling', () => {
    it('handles 401 unauthorized errors gracefully', async () => {
      vi.mocked(bookingApi.getProviderBookings).mockRejectedValue(new Error('401 Session Expired'));

      const controller = new ProfessionalHomeScreenController({});
      await controller.init();

      expect(controller.getState().overview).toBeNull();
      expect(controller.getState().error).toContain('UNAUTHORIZED_EXPIRED_SESSION');
    });

    it('handles 403 access denied errors gracefully', async () => {
      vi.mocked(bookingApi.getProviderBookings).mockRejectedValue(new Error('403 Access denied'));

      const controller = new ProfessionalHomeScreenController({});
      await controller.init();

      expect(controller.getState().error).toContain('ACCESS_DENIED_PROFESSIONAL');
    });
  });
});
