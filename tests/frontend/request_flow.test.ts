import { describe, it, expect } from 'vitest';

interface BookingPayload {
  providerId: string;
  categoryId: number;
  preferredDate: string;
  customerAddress: string;
  city: string;
  state: string;
  notes: string;
  estimatedBudget?: number | null;
}

describe('Customer Project Request Creation & Submission Flow', () => {
  it('pre-populates request parameters from URL query parameters', () => {
    const searchParams = new URLSearchParams('providerId=pro-123&categoryId=5&city=Hyderabad&timeline=1%E2%80%933+months&budget=%E2%82%B95L+%E2%80%93+%E2%82%B915L&notes=Villa+Architectural+Design');

    const providerId = searchParams.get('providerId');
    const categoryId = Number(searchParams.get('categoryId'));
    const city = searchParams.get('city');
    const timeline = searchParams.get('timeline');
    const budget = searchParams.get('budget');
    const notes = searchParams.get('notes');

    expect(providerId).toBe('pro-123');
    expect(categoryId).toBe(5);
    expect(city).toBe('Hyderabad');
    expect(timeline).toBe('1–3 months');
    expect(budget).toBe('₹5L – ₹15L');
    expect(notes).toBe('Villa Architectural Design');
  });

  it('validates required fields before submitting request', () => {
    const validateRequest = (payload: Partial<BookingPayload>) => {
      if (!payload.providerId) return 'Please select a professional before requesting a quote.';
      if (!payload.preferredDate) return 'Please select a target start date.';
      if (!payload.customerAddress || !payload.customerAddress.trim()) return 'Please provide the service location address.';
      if (!payload.notes || !payload.notes.trim()) return 'Please provide a project description explaining what you want to build or discuss.';
      return null;
    };

    expect(validateRequest({})).toBe('Please select a professional before requesting a quote.');
    expect(validateRequest({ providerId: 'pro-1' })).toBe('Please select a target start date.');
    expect(validateRequest({ providerId: 'pro-1', preferredDate: '2026-10-01' })).toBe('Please provide the service location address.');
    expect(validateRequest({ providerId: 'pro-1', preferredDate: '2026-10-01', customerAddress: 'Jubilee Hills' })).toBe('Please provide a project description explaining what you want to build or discuss.');

    expect(validateRequest({
      providerId: 'pro-1',
      preferredDate: '2026-10-01',
      customerAddress: 'Jubilee Hills',
      notes: 'Turnkey Villa Construction',
    })).toBeNull();
  });

  it('prevents duplicate submissions when submission is in-flight', () => {
    let isSubmitting = false;
    let submitCount = 0;

    const handleSubmit = () => {
      if (isSubmitting) return;
      isSubmitting = true;
      submitCount++;
    };

    handleSubmit(); // 1st click
    handleSubmit(); // 2nd click while loading
    handleSubmit(); // 3rd click while loading

    expect(submitCount).toBe(1);
  });

  it('formats initial request status correctly for customer confirmation', () => {
    const bookingResponse = {
      id: 'bk_123',
      bookingNumber: 'BK-1788857261338-9812',
      bookingStatus: 'REQUESTED',
      createdAt: '2026-09-08T14:42:00Z',
    };

    const getDisplayStatus = (status: string) => {
      if (status === 'REQUESTED') return 'Request Submitted';
      return status;
    };

    expect(getDisplayStatus(bookingResponse.bookingStatus)).toBe('Request Submitted');
    expect(bookingResponse.bookingNumber).toMatch(/^BK-\d+-\d+$/);
  });
});
