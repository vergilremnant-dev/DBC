/**
 * DBC Mobile Marketplace & Service Discovery Types.
 * Unified domain types for categories, search, professional profiles, curated projects,
 * project assistant, and request handoff context.
 */

export interface MobileCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  iconEmoji: string;
  isFeatured?: boolean;
  providerCount?: number;
}

export interface MobileProfessional {
  id: string;
  userId?: number;
  businessName: string;
  tagline?: string;
  categoryName: string;
  categoryId?: number;
  city: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured?: boolean;
  avatarUrl?: string;
  skills: string[];
  hourlyRate?: number;
  completedProjectsCount?: number;
  bio?: string;
  portfolioImages?: string[];
}

export interface MobileSearchParams {
  query?: string;
  categoryId?: number;
  categorySlug?: string;
  city?: string;
  isVerifiedOnly?: boolean;
  minRating?: number;
  sortBy?: 'recommended' | 'rating' | 'reviews' | 'name';
  page?: number;
  limit?: number;
}

export interface MobileFilterOptions {
  cities: string[];
  categories: { id: number; name: string }[];
  sortOptions: { label: string; value: MobileSearchParams['sortBy'] }[];
}

export interface MobileCuratedProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  estimatedBudget: string;
  estimatedDuration: string;
  requiredProfessions: string[];
}

export interface ProjectAssistantStep {
  stepIndex: number;
  title: string;
  subtitle: string;
  options: { label: string; value: string; icon?: string }[];
}

export interface ProjectRequestContext {
  providerId?: string;
  providerName?: string;
  categoryId?: number;
  categoryName?: string;
  city?: string;
  notes?: string;
  estimatedBudget?: string;
}
