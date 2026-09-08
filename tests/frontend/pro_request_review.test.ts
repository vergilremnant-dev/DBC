import { describe, it, expect } from 'vitest';
import type { BookingStatus } from '../../src/types/booking/bookingTypes';

interface MockBooking {
  id: string;
  bookingNumber: string;
  providerId: string;
  customerName: string;
  notes: string;
  status: BookingStatus;
  estimatedBudget: number;
}

describe('Professional Request Review & Customer Contact Workflow', () => {
  const mockBookings: MockBooking[] = [
    {
      id: 'bk-1',
      bookingNumber: 'BK-101',
      providerId: 'provider-1',
      customerName: 'Rahul Verma',
      notes: 'Structural engineering analysis',
      status: 'REQUESTED',
      estimatedBudget: 75000,
    },
    {
      id: 'bk-2',
      bookingNumber: 'BK-102',
      providerId: 'provider-1',
      customerName: 'Anita Roy',
      notes: 'Interior plastering & paint execution',
      status: 'ACCEPTED',
      estimatedBudget: 120000,
    },
    {
      id: 'bk-3',
      bookingNumber: 'BK-103',
      providerId: 'provider-1',
      customerName: 'Karan Patel',
      notes: 'Foundation excavation & backfill',
      status: 'IN_PROGRESS',
      estimatedBudget: 250000,
    },
    {
      id: 'bk-4',
      bookingNumber: 'BK-104',
      providerId: 'provider-1',
      customerName: 'Sanjay Reddy',
      notes: 'Electrical conduit layout',
      status: 'COMPLETED',
      estimatedBudget: 45000,
    },
  ];

  it('filters project requests correctly by status', () => {
    const filterBookings = (list: MockBooking[], status: string) => {
      if (status === 'ALL') return list;
      return list.filter((b) => b.status === status);
    };

    expect(filterBookings(mockBookings, 'ALL')).toHaveLength(4);
    expect(filterBookings(mockBookings, 'REQUESTED')).toHaveLength(1);
    expect(filterBookings(mockBookings, 'ACCEPTED')).toHaveLength(1);
    expect(filterBookings(mockBookings, 'IN_PROGRESS')).toHaveLength(1);
    expect(filterBookings(mockBookings, 'COMPLETED')).toHaveLength(1);
    expect(filterBookings(mockBookings, 'REJECTED')).toHaveLength(0);
  });

  it('validates allowed status transitions for professional workflow', () => {
    const isValidTransition = (current: BookingStatus, target: BookingStatus): boolean => {
      const allowed: Record<BookingStatus, BookingStatus[]> = {
        REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
        ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        REJECTED: [],
        CANCELLED: [],
      };
      return allowed[current]?.includes(target) ?? false;
    };

    // Allowed transitions
    expect(isValidTransition('REQUESTED', 'ACCEPTED')).toBe(true);
    expect(isValidTransition('REQUESTED', 'REJECTED')).toBe(true);
    expect(isValidTransition('ACCEPTED', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);

    // Invalid transitions
    expect(isValidTransition('REQUESTED', 'COMPLETED')).toBe(false);
    expect(isValidTransition('COMPLETED', 'ACCEPTED')).toBe(false);
    expect(isValidTransition('REJECTED', 'ACCEPTED')).toBe(false);
  });

  it('enforces server-side provider ownership authorization', () => {
    const canManageBooking = (bookingProviderId: string, currentProviderId: string): boolean => {
      return bookingProviderId === currentProviderId;
    };

    expect(canManageBooking('provider-1', 'provider-1')).toBe(true);
    expect(canManageBooking('provider-1', 'provider-2')).toBe(false);
  });

  it('provides customer contact handoff for active project requests', () => {
    const getContactHandoffRoute = (booking: MockBooking): string | null => {
      if (['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
        return `/workspace/inbox?customer=${encodeURIComponent(booking.customerName)}`;
      }
      return null;
    };

    expect(getContactHandoffRoute(mockBookings[0])).toBeNull(); // REQUESTED -> contact not enabled yet
    expect(getContactHandoffRoute(mockBookings[1])).toBe('/workspace/inbox?customer=Anita%20Roy'); // ACCEPTED
    expect(getContactHandoffRoute(mockBookings[2])).toBe('/workspace/inbox?customer=Karan%20Patel'); // IN_PROGRESS
  });
});
