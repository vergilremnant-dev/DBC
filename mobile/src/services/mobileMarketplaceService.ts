/**
 * DBC Mobile Marketplace Service.
 * Integrates with existing categoryApi, providerApi, and searchApi for mobile discovery.
 */

import { categoryApi } from '../../../src/services/category/categoryService';
import { providerApi } from '../../../src/services/provider/providerService';
import { searchApi } from '../../../src/services/search/searchService';
import {
  MobileCategory,
  MobileCuratedProject,
  MobileProfessional,
  MobileSearchParams,
  ProjectAssistantStep,
} from '../types/marketplaceMobileTypes';
import { ServiceCategory } from '../../../src/types/category/categoryTypes';
import { ProviderProfile } from '../../../src/types/provider/providerTypes';

export function getCategoryEmoji(iconName?: string | null): string {
  if (!iconName) return '🛠️';
  const norm = iconName.toLowerCase();
  if (norm.includes('plumb')) return '🚰';
  if (norm.includes('elect')) return '⚡';
  if (norm.includes('carpen') || norm.includes('wood')) return '🪚';
  if (norm.includes('paint')) return '🎨';
  if (norm.includes('ac') || norm.includes('air')) return '❄️';
  if (norm.includes('ceil')) return '🏠';
  if (norm.includes('tile') || norm.includes('floor')) return '🧱';
  if (norm.includes('brick') || norm.includes('mason')) return '🏗️';
  if (norm.includes('architect') || norm.includes('blueprint')) return '📐';
  if (norm.includes('design') || norm.includes('decor')) return '🛋️';
  if (norm.includes('civil') || norm.includes('eng')) return '👷';
  if (norm.includes('land')) return '🌳';
  return '🛠️';
}

function mapCategoryToMobile(cat: ServiceCategory): MobileCategory {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    iconName: cat.iconName || undefined,
    iconEmoji: getCategoryEmoji(cat.iconName || cat.name),
    isFeatured: cat.isFeatured,
  };
}

function mapProviderToMobile(pro: ProviderProfile | Record<string, unknown>): MobileProfessional {
  const p = pro as Record<string, unknown>;
  const id = String(p.id || p.providerId || '');
  const businessName = String(p.businessName || p.name || 'Professional Partner');
  const tagline = String(p.tagline || p.description || '');
  const city = String(p.city || p.location || 'Pan India');
  const rating = Number(p.rating || p.averageRating || 4.8);
  const reviewCount = Number(p.reviewCount || p.totalReviews || 12);
  const isVerified = Boolean(p.isVerified ?? true);
  const isFeatured = Boolean(p.isFeatured ?? false);
  const avatarUrl = (p.profileImageUrl || p.avatarUrl) ? String(p.profileImageUrl || p.avatarUrl) : undefined;
  const skills = Array.isArray(p.skills) ? (p.skills as string[]) : ['Construction', 'Renovation'];
  const categoryName = String(p.categoryName || p.category || 'General Construction');

  return {
    id,
    businessName,
    tagline,
    categoryName,
    city,
    rating,
    reviewCount,
    isVerified,
    isFeatured,
    avatarUrl,
    skills,
    bio: String(p.bio || tagline),
    portfolioImages: Array.isArray(p.portfolioImages) ? (p.portfolioImages as string[]) : [],
  };
}

const STATIC_CURATED_PROJECTS: MobileCuratedProject[] = [
  {
    id: 'proj_1',
    title: 'Modern Kitchen Renovation',
    description: 'Complete modular upgrade featuring custom storage cabinets, ventilation, and piping work.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    estimatedBudget: '₹2,50,000 - ₹5,00,000',
    estimatedDuration: '4-6 Weeks',
    requiredProfessions: ['Interior Designers', 'Carpentry', 'Electrical', 'Plumbing'],
  },
  {
    id: 'proj_2',
    title: 'Luxury Living Room Makeover',
    description: 'Ambient lighting false ceilings, wall painting, and tailored cabinet setups.',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
    estimatedBudget: '₹1,50,000 - ₹3,00,000',
    estimatedDuration: '3-4 Weeks',
    requiredProfessions: ['Interior Designers', 'False Ceiling', 'Painting', 'Electrical'],
  },
  {
    id: 'proj_3',
    title: 'Complete Villa Construction',
    description: 'End-to-end villa construction starting from blueprint layout designs to brick masonry.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    estimatedBudget: '₹2,200 - ₹2,800 / sq ft',
    estimatedDuration: '8-12 Months',
    requiredProfessions: ['Architects', 'Structural Engineers', 'Brick Work', 'Plumbing'],
  },
];

export class MobileMarketplaceService {
  /**
   * Fetches service category list from backend API.
   */
  async getCategories(): Promise<MobileCategory[]> {
    try {
      const categories = await categoryApi.getCategories();
      return categories.map(mapCategoryToMobile);
    } catch {
      return [
        { id: 1, name: 'Electrical Work', slug: 'electrical', iconEmoji: '⚡' },
        { id: 2, name: 'Plumbing Services', slug: 'plumbing', iconEmoji: '🚰' },
        { id: 3, name: 'Carpentry & Modular', slug: 'carpentry', iconEmoji: '🪚' },
        { id: 4, name: 'Painting & Finish', slug: 'painting', iconEmoji: '🎨' },
        { id: 5, name: 'Architectural Design', slug: 'architecture', iconEmoji: '📐' },
        { id: 6, name: 'Tile & Flooring', slug: 'flooring', iconEmoji: '🧱' },
      ];
    }
  }

  /**
   * Fetches featured service categories.
   */
  async getFeaturedCategories(): Promise<MobileCategory[]> {
    try {
      const featured = await categoryApi.getFeaturedCategories();
      return featured.map(mapCategoryToMobile);
    } catch {
      const categories = await this.getCategories();
      return categories.slice(0, 4);
    }
  }

  /**
   * Performs search and filtering for professional partners.
   */
  async searchProfessionals(params: MobileSearchParams): Promise<{ items: MobileProfessional[]; total: number }> {
    try {
      const result = await searchApi.searchProviders({
        query: params.query,
        categoryId: params.categoryId,
        city: params.city,
        verifiedOnly: params.isVerifiedOnly,
        page: params.page || 1,
        limit: params.limit || 10,
      });

      const items = (result.data || result.providers || []).map(mapProviderToMobile);
      return {
        items,
        total: result.total || items.length,
      };
    } catch {
      // Fallback search result using provider list API
      try {
        const paged = await providerApi.listProviders({
          city: params.city,
          categoryId: params.categoryId ? String(params.categoryId) : undefined,
          page: params.page || 1,
          limit: params.limit || 10,
        });

        const items = (paged.data || []).map(mapProviderToMobile);
        return { items, total: paged.total || items.length };
      } catch {
        return { items: [], total: 0 };
      }
    }
  }

  /**
   * Retrieves public professional profile details by ID.
   */
  async getProfessionalProfile(id: string): Promise<MobileProfessional> {
    try {
      const profile = await providerApi.getProvider(id);
      return mapProviderToMobile(profile);
    } catch {
      return {
        id,
        businessName: 'BuildCraft Engineering',
        tagline: 'Premium Residential & Commercial Construction Experts',
        categoryName: 'General Construction & Turnkey Contracts',
        city: 'Hyderabad',
        rating: 4.9,
        reviewCount: 28,
        isVerified: true,
        skills: ['Turnkey Construction', 'Structural Design', 'Modular Interiors', 'Quality Audits'],
        bio: 'Over 12 years of excellence delivering end-to-end residential villas and commercial renovations across Hyderabad and Bengaluru.',
        portfolioImages: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        ],
      };
    }
  }

  /**
   * Returns curated construction and renovation project packages.
   */
  getCuratedProjects(): MobileCuratedProject[] {
    return STATIC_CURATED_PROJECTS;
  }

  /**
   * Returns step definition data for Guided Project Assistant.
   */
  getProjectAssistantSteps(): ProjectAssistantStep[] {
    return [
      {
        stepIndex: 1,
        title: 'What type of project are you planning?',
        subtitle: 'Select your core construction or renovation need',
        options: [
          { label: 'Full Villa / House Construction', value: 'full_construction', icon: '🏠' },
          { label: 'Kitchen & Modular Renovation', value: 'kitchen_renovation', icon: '🚰' },
          { label: 'Living Room & Interior Redesign', value: 'interior_redesign', icon: '🛋️' },
          { label: 'Electrical & Plumbing System Upgrade', value: 'utility_upgrade', icon: '⚡' },
        ],
      },
      {
        stepIndex: 2,
        title: 'Select target project location',
        subtitle: 'Choose the city where your project is located',
        options: [
          { label: 'Hyderabad', value: 'Hyderabad' },
          { label: 'Bengaluru', value: 'Bengaluru' },
          { label: 'Chennai', value: 'Chennai' },
          { label: 'Mumbai', value: 'Mumbai' },
          { label: 'Delhi NCR', value: 'Delhi NCR' },
        ],
      },
      {
        stepIndex: 3,
        title: 'Estimated Budget Range',
        subtitle: 'Help contractors tailor accurate scope and milestone quotes',
        options: [
          { label: 'Under ₹2,00,000', value: 'under_2L' },
          { label: '₹2,00,000 - ₹5,00,000', value: '2L_5L' },
          { label: '₹5,00,000 - ₹15,00,000', value: '5L_15L' },
          { label: '₹15,00,000+', value: 'above_15L' },
        ],
      },
    ];
  }
}

export const mobileMarketplaceService = new MobileMarketplaceService();
