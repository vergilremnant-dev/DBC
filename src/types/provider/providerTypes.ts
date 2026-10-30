export interface ProviderProfile {
  id: string;
  /** Not included in public marketplace responses. */
  userId?: string;
  fullName: string;
  businessName: string | null;
  profileImage: string | null;
  coverImage: string | null;
  description: string | null;
  experienceYears: number;
  city: string;
  state: string;
  serviceAreas: string | null;
  categoryId: number;
  /** Profile endpoint only, masked unless the viewer is entitled. Never in search results. */
  phoneNumber?: string;
  /** Not included in public marketplace responses. */
  email?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  isAvailable: boolean;
  isFeatured: boolean;
  canProvideServices: boolean;
  canProvideConsultation: boolean;
  consultationFee: number;
  totalConsultations: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    categoryType?: string;
    workforceTypeId?: string;
  } | null;
  portfolios?: unknown[];
  reviews?: unknown[];
}

export interface CreateProviderRequest {
  fullName: string;
  businessName?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  description?: string | null;
  experienceYears: number;
  city: string;
  state: string;
  serviceAreas?: string | null;
  categoryId: number;
  phoneNumber: string;
  email: string;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
  consultationFee?: number;
}

export interface UpdateProviderRequest {
  fullName?: string;
  businessName?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  description?: string | null;
  experienceYears?: number;
  city?: string;
  state?: string;
  serviceAreas?: string | null;
  categoryId?: number;
  phoneNumber?: string;
  email?: string;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
  consultationFee?: number;
}

export interface ProvidersQueryFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  city?: string;
  search?: string;
  isFeatured?: boolean;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
}

export interface PagedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}
