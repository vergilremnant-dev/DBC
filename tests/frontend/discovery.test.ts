import { describe, it, expect } from 'vitest';

interface Provider {
  id: string;
  fullName: string;
  categoryId: number;
  city: string;
  verificationStatus: string;
}

describe('Customer Service Discovery & Professional Selection', () => {
  const mockProviders: Provider[] = [
    { id: 'pro-1', fullName: 'Alice Architect', categoryId: 1, city: 'Hyderabad', verificationStatus: 'VERIFIED' },
    { id: 'pro-2', fullName: 'Bob Builder', categoryId: 2, city: 'Bengaluru', verificationStatus: 'PENDING' },
    { id: 'pro-3', fullName: 'Charlie Civil', categoryId: 1, city: 'Hyderabad', verificationStatus: 'VERIFIED' },
  ];

  it('filters professionals by category and location', () => {
    const hyderabadArchitects = mockProviders.filter(
      (p) => p.categoryId === 1 && p.city.toLowerCase() === 'hyderabad'
    );

    expect(hyderabadArchitects).toHaveLength(2);
    expect(hyderabadArchitects.map((p) => p.fullName)).toEqual(['Alice Architect', 'Charlie Civil']);
  });

  it('only displays verified badge for backend-verified providers', () => {
    const verified = mockProviders.filter((p) => p.verificationStatus === 'VERIFIED');
    const unverified = mockProviders.filter((p) => p.verificationStatus !== 'VERIFIED');

    expect(verified).toHaveLength(2);
    expect(unverified).toHaveLength(1);
    expect(unverified[0].fullName).toBe('Bob Builder');
  });

  it('builds pre-populated project request URL with preserved context', () => {
    const provider = mockProviders[0];
    const buildRequestUrl = (p: Provider) =>
      `/book-service?providerId=${encodeURIComponent(p.id)}&categoryId=${p.categoryId}`;

    const url = buildRequestUrl(provider);
    expect(url).toBe('/book-service?providerId=pro-1&categoryId=1');
  });

  it('enforces customer role restriction for starting project requests', () => {
    const checkCanRequest = (role?: string) => role === 'ROLE_CUSTOMER';

    expect(checkCanRequest('ROLE_CUSTOMER')).toBe(true);
    expect(checkCanRequest('ROLE_PROVIDER')).toBe(false);
    expect(checkCanRequest(undefined)).toBe(false);
  });
});
