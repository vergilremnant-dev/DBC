import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemoryStorageAdapter } from '../../mobile/src/storage/StorageAdapter';
import { MobileAuthStore } from '../../mobile/src/state/authStore';
import { mobileMarketplaceService, getCategoryEmoji } from '../../mobile/src/services/mobileMarketplaceService';
import { categoryApi } from '../../src/services/category/categoryService';
import { searchApi } from '../../src/services/search/searchService';
import { providerApi } from '../../src/services/provider/providerService';
import { MarketplaceHomeController, renderMarketplaceHomeScreenDescriptor } from '../../mobile/src/screens/marketplace/MarketplaceHomeScreen';
import { CategorySearchController, renderCategorySearchScreenDescriptor } from '../../mobile/src/screens/marketplace/CategorySearchScreen';
import { ProfessionalProfileController, renderProfessionalProfileScreenDescriptor } from '../../mobile/src/screens/marketplace/ProfessionalProfileScreen';
import { ProjectAssistantController, renderProjectAssistantModalDescriptor } from '../../mobile/src/screens/marketplace/ProjectAssistantModal';
import { projectRequestHandoffController } from '../../mobile/src/screens/marketplace/ProjectRequestHandoff';

vi.mock('../../src/services/category/categoryService', () => ({
  categoryApi: {
    getCategories: vi.fn(),
    getFeaturedCategories: vi.fn(),
  },
}));

vi.mock('../../src/services/search/searchService', () => ({
  searchApi: {
    searchProviders: vi.fn(),
  },
}));

vi.mock('../../src/services/provider/providerService', () => ({
  providerApi: {
    getProvider: vi.fn(),
    listProviders: vi.fn(),
  },
}));

describe('Module 35 — Customer Mobile Marketplace & Service Discovery Test Suite', () => {
  let memoryStorage: MemoryStorageAdapter;
  let authStore: MobileAuthStore;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryStorage = new MemoryStorageAdapter();
    authStore = new MobileAuthStore(memoryStorage);
  });

  describe('1. Category Emoji & Helper Resolution', () => {
    it('should map category names to appropriate construction emojis', () => {
      expect(getCategoryEmoji('Plumbing Work')).toBe('🚰');
      expect(getCategoryEmoji('Electrical Installation')).toBe('⚡');
      expect(getCategoryEmoji('Carpentry & Woodwork')).toBe('🪚');
      expect(getCategoryEmoji('Painting')).toBe('🎨');
      expect(getCategoryEmoji('Architectural Design')).toBe('📐');
      expect(getCategoryEmoji('Unknown Work')).toBe('🛠️');
    });
  });

  describe('2. Marketplace Home Screen Workflows', () => {
    it('should load categories, featured contractors, and curated projects successfully', async () => {
      vi.mocked(categoryApi.getCategories).mockResolvedValueOnce([
        { id: 1, name: 'Electrical Work', slug: 'electrical', displayOrder: 1, isActive: true, isFeatured: true, iconName: 'elect' },
        { id: 2, name: 'Plumbing Services', slug: 'plumbing', displayOrder: 2, isActive: true, isFeatured: true, iconName: 'plumb' },
      ]);
      vi.mocked(categoryApi.getFeaturedCategories).mockResolvedValueOnce([
        { id: 1, name: 'Electrical Work', slug: 'electrical', displayOrder: 1, isActive: true, isFeatured: true, iconName: 'elect' },
      ]);
      vi.mocked(searchApi.searchProviders).mockResolvedValueOnce({
        data: [
          { id: 'pro_101', businessName: 'Ace Electricians', categoryName: 'Electrical Work', city: 'Hyderabad', rating: 4.9, reviewCount: 15, isVerified: true },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const controller = new MarketplaceHomeController();
      controller.setSelectedCity('Hyderabad');
      await controller.loadMarketplaceData();

      const state = controller.getState();
      expect(state.categories.length).toBe(2);
      expect(state.featuredCategories.length).toBe(1);
      expect(state.featuredProfessionals.length).toBe(1);
      expect(state.curatedProjects.length).toBeGreaterThan(0);

      const descriptor = renderMarketplaceHomeScreenDescriptor(state);
      expect(descriptor.header.locationSelector.selected).toBe('Hyderabad');
      expect(descriptor.categoriesSection.items.length).toBe(2);
    });

    it('should handle API failure gracefully with fallback categories', async () => {
      vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(categoryApi.getFeaturedCategories).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(searchApi.searchProviders).mockRejectedValueOnce(new Error('Network error'));

      const controller = new MarketplaceHomeController();
      await controller.loadMarketplaceData();

      const state = controller.getState();
      expect(state.categories.length).toBeGreaterThan(0); // Fallback categories present
    });
  });

  describe('3. Category Search & Filtering Workflows', () => {
    it('should execute keyword and category search with filters', async () => {
      vi.mocked(categoryApi.getCategories).mockResolvedValueOnce([
        { id: 1, name: 'Electrical Work', slug: 'electrical', displayOrder: 1, isActive: true, isFeatured: true },
      ]);
      vi.mocked(searchApi.searchProviders).mockResolvedValueOnce({
        data: [
          { id: 'pro_201', businessName: 'Volt Masters', categoryName: 'Electrical Work', city: 'Hyderabad', rating: 4.8, reviewCount: 9, isVerified: true },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const controller = new CategorySearchController();
      controller.setQuery('Volt');
      controller.setCategory(1, 'electrical');
      controller.setFilterVerifiedOnly(true);

      await controller.executeSearch();

      const state = controller.getState();
      expect(state.results.length).toBe(1);
      expect(state.results[0].businessName).toBe('Volt Masters');

      const descriptor = renderCategorySearchScreenDescriptor(state);
      expect(descriptor.resultsList.length).toBe(1);
      expect(descriptor.filterBar.activeFiltersCount).toBe(2);
    });

    it('should display empty state when no search results match', async () => {
      vi.mocked(searchApi.searchProviders).mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const controller = new CategorySearchController();
      controller.setQuery('NonExistentVendor');
      await controller.executeSearch();

      const descriptor = renderCategorySearchScreenDescriptor(controller.getState());
      expect(descriptor.emptyState).not.toBeNull();
      expect(descriptor.emptyState?.message).toContain('No professional contractors match');
    });
  });

  describe('4. Professional Profile Screen Workflows', () => {
    it('should load public professional profile details and portfolio', async () => {
      vi.mocked(providerApi.getProvider).mockResolvedValueOnce({
        id: 'pro_301',
        businessName: 'Apex Turnkey Constructions',
        tagline: 'Luxury Villa Specialist',
        categoryName: 'General Construction',
        city: 'Hyderabad',
        rating: 4.95,
        reviewCount: 32,
        isVerified: true,
        skills: ['Villa Construction', 'Structural Engineering', 'False Ceiling'],
        profileImageUrl: 'https://example.com/avatar.jpg',
        portfolioImages: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
        description: 'Over 15 years in luxury home builds.',
      } as any);

      const controller = new ProfessionalProfileController('pro_301');
      await controller.loadProfile();

      const state = controller.getState();
      expect(state.profile?.businessName).toBe('Apex Turnkey Constructions');
      expect(state.profile?.skills).toContain('Villa Construction');

      const context = controller.getProjectRequestContext();
      expect(context.providerId).toBe('pro_301');
      expect(context.providerName).toBe('Apex Turnkey Constructions');

      const descriptor = renderProfessionalProfileScreenDescriptor(state);
      expect(descriptor.header.title).toBe('Apex Turnkey Constructions');
      expect(descriptor.primaryCtaBar.label).toBe('Start Project Request');
    });
  });

  describe('5. Guided Project Assistant Workflows', () => {
    it('should step through guided assistant and generate request context', () => {
      const assistant = new ProjectAssistantController();
      expect(assistant.getState().currentStepIndex).toBe(1);

      assistant.selectOption(1, 'full_construction');
      assistant.nextStep();
      expect(assistant.getState().currentStepIndex).toBe(2);

      assistant.selectOption(2, 'Hyderabad');
      assistant.nextStep();
      expect(assistant.getState().currentStepIndex).toBe(3);

      assistant.selectOption(3, '5L_15L');
      assistant.nextStep();
      expect(assistant.getState().isComplete).toBe(true);

      const requestContext = assistant.getProjectRequestContext();
      expect(requestContext.categoryName).toBe('full_construction');
      expect(requestContext.city).toBe('Hyderabad');
      expect(requestContext.estimatedBudget).toBe('5L_15L');

      const modalDescriptor = renderProjectAssistantModalDescriptor(assistant.getState());
      expect(modalDescriptor.header.title).toBe('Guided Project Assistant');
    });
  });

  describe('6. Project Request Handoff & Authentication Boundary', () => {
    it('should proceed directly to request form if user is authenticated', async () => {
      await authStore.setSession(
        { id: '99', email: 'user@dbc.com', name: 'John Doe', role: 'customer' },
        'jwt_token'
      );

      const result = projectRequestHandoffController.initiateRequest({
        providerId: 'pro_301',
        providerName: 'Apex Turnkey Constructions',
        city: 'Hyderabad',
      }, authStore);

      expect(result.isAuthenticated).toBe(true);
      expect(result.nextRoute).toBe('ProjectRequestForm');
    });

    it('should preserve request context in pendingTarget and trigger auth handoff if unauthenticated', async () => {
      await authStore.logout();

      const requestContext = {
        providerId: 'pro_301',
        providerName: 'Apex Turnkey Constructions',
        categoryId: 1,
        city: 'Hyderabad',
        notes: 'Villa construction quote needed',
      };

      const result = projectRequestHandoffController.initiateRequest(requestContext, authStore);

      expect(result.isAuthenticated).toBe(false);
      expect(result.nextRoute).toBe('Login');

      // Verify context saved in authStore pendingTarget
      expect(authStore.getState().pendingTarget?.routeName).toBe('ProjectRequestForm');
      expect(authStore.getState().pendingTarget?.params).toEqual(requestContext);

      // Verify post-login restoration
      const restored = projectRequestHandoffController.restorePendingRequestContext(authStore);
      expect(restored?.providerId).toBe('pro_301');
      expect(restored?.notes).toContain('Villa construction');
      expect(authStore.getState().pendingTarget).toBeNull();
    });
  });
});
