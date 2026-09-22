/**
 * Mobile Marketplace Home Screen Component & Controller for DBC Mobile Application.
 * Displays Search Bar, Location City Selector, Popular Categories, Featured Professionals,
 * Curated Construction Projects, and Project Assistant launcher.
 */

import { mobileMarketplaceService } from '../../services/mobileMarketplaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileCategory, MobileCuratedProject, MobileProfessional } from '../../types/marketplaceMobileTypes';

export interface MarketplaceHomeState {
  selectedCity: string;
  availableCities: string[];
  searchQuery: string;
  categories: MobileCategory[];
  featuredCategories: MobileCategory[];
  featuredProfessionals: MobileProfessional[];
  curatedProjects: MobileCuratedProject[];
  isLoading: boolean;
  errorMessage: string | null;
  isProjectAssistantOpen: boolean;
}

export class MarketplaceHomeController {
  private state: MarketplaceHomeState = {
    selectedCity: 'Hyderabad',
    availableCities: ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi NCR', 'Pune', 'Kolkata'],
    searchQuery: '',
    categories: [],
    featuredCategories: [],
    featuredProfessionals: [],
    curatedProjects: [],
    isLoading: false,
    errorMessage: null,
    isProjectAssistantOpen: false,
  };

  getState(): MarketplaceHomeState {
    return { ...this.state };
  }

  setSelectedCity(city: string) {
    this.state.selectedCity = city;
  }

  setSearchQuery(query: string) {
    this.state.searchQuery = query;
  }

  toggleProjectAssistant(isOpen: boolean) {
    this.state.isProjectAssistantOpen = isOpen;
  }

  async loadMarketplaceData(): Promise<void> {
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      const [categories, featuredCat, proResult] = await Promise.all([
        mobileMarketplaceService.getCategories(),
        mobileMarketplaceService.getFeaturedCategories(),
        mobileMarketplaceService.searchProfessionals({ city: this.state.selectedCity, limit: 5 }),
      ]);

      this.state.categories = categories;
      this.state.featuredCategories = featuredCat.length > 0 ? featuredCat : categories.slice(0, 4);
      this.state.featuredProfessionals = proResult.items;
      this.state.curatedProjects = mobileMarketplaceService.getCuratedProjects();
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load marketplace content';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderMarketplaceHomeScreenDescriptor = (state: MarketplaceHomeState) => ({
  type: 'Screen',
  name: 'MarketplaceHomeScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    paddingHorizontal: mobileTheme.spacing.md,
  },
  header: {
    logoText: 'DBC Construction Marketplace',
    locationSelector: {
      label: 'City',
      selected: state.selectedCity,
      options: state.availableCities,
      minHeight: mobileTheme.touchTargets.minTouchArea,
    },
  },
  searchBar: {
    placeholder: 'Search architects, electricians, carpenters, contractors...',
    value: state.searchQuery,
    minHeight: mobileTheme.touchTargets.inputHeight,
  },
  assistantBanner: {
    title: 'Need guidance for your project?',
    subtitle: 'Use Guided Project Assistant to get custom quotes',
    buttonLabel: 'Start Project Assistant',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  },
  categoriesSection: {
    title: 'Popular Construction & Service Categories',
    items: state.categories.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.iconEmoji,
      minHeight: mobileTheme.touchTargets.minTouchArea,
    })),
  },
  featuredProfessionalsSection: {
    title: 'Verified Professional Contractors',
    items: state.featuredProfessionals.map((p) => ({
      id: p.id,
      name: p.businessName,
      category: p.categoryName,
      city: p.city,
      rating: p.rating,
      reviewCount: p.reviewCount,
      isVerified: p.isVerified,
      avatarUrl: p.avatarUrl,
      actionLabel: 'View Profile',
      minHeight: mobileTheme.touchTargets.buttonHeight,
    })),
  },
  curatedProjectsSection: {
    title: 'Curated Construction & Renovation Packages',
    items: state.curatedProjects.map((proj) => ({
      id: proj.id,
      title: proj.title,
      budget: proj.estimatedBudget,
      duration: proj.estimatedDuration,
      professions: proj.requiredProfessions,
    })),
  },
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
