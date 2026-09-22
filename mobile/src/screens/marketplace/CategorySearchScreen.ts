/**
 * Mobile Category Results & Search Screen Component & Controller for DBC Mobile Application.
 * Supports keyword search, category filtering, filter bottom sheet modal, and sorting.
 */

import { mobileMarketplaceService } from '../../services/mobileMarketplaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileCategory, MobileProfessional, MobileSearchParams } from '../../types/marketplaceMobileTypes';

export interface CategorySearchState {
  searchParams: MobileSearchParams;
  categories: MobileCategory[];
  results: MobileProfessional[];
  totalResults: number;
  isLoading: boolean;
  isFilterSheetOpen: boolean;
  errorMessage: string | null;
}

export class CategorySearchController {
  private state: CategorySearchState = {
    searchParams: {
      query: '',
      city: 'Hyderabad',
      isVerifiedOnly: false,
      sortBy: 'recommended',
      page: 1,
      limit: 10,
    },
    categories: [],
    results: [],
    totalResults: 0,
    isLoading: false,
    isFilterSheetOpen: false,
    errorMessage: null,
  };

  getState(): CategorySearchState {
    return { ...this.state };
  }

  setQuery(query: string) {
    this.state.searchParams.query = query;
  }

  setCategory(categoryId?: number, categorySlug?: string) {
    this.state.searchParams.categoryId = categoryId;
    this.state.searchParams.categorySlug = categorySlug;
  }

  setCity(city: string) {
    this.state.searchParams.city = city;
  }

  setFilterVerifiedOnly(verifiedOnly: boolean) {
    this.state.searchParams.isVerifiedOnly = verifiedOnly;
  }

  setSortBy(sortBy: MobileSearchParams['sortBy']) {
    this.state.searchParams.sortBy = sortBy;
  }

  toggleFilterSheet(isOpen: boolean) {
    this.state.isFilterSheetOpen = isOpen;
  }

  async executeSearch(): Promise<void> {
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      if (this.state.categories.length === 0) {
        this.state.categories = await mobileMarketplaceService.getCategories();
      }

      const { items, total } = await mobileMarketplaceService.searchProfessionals(this.state.searchParams);
      this.state.results = items;
      this.state.totalResults = total;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to search professionals';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCategorySearchScreenDescriptor = (state: CategorySearchState) => ({
  type: 'Screen',
  name: 'CategorySearchScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    paddingHorizontal: mobileTheme.spacing.md,
  },
  searchHeader: {
    query: state.searchParams.query,
    selectedCity: state.searchParams.city,
    selectedCategory: state.searchParams.categoryId,
    minHeight: mobileTheme.touchTargets.inputHeight,
  },
  filterBar: {
    filterButtonLabel: 'Filters',
    activeFiltersCount: (state.searchParams.isVerifiedOnly ? 1 : 0) + (state.searchParams.categoryId ? 1 : 0),
    sortOption: state.searchParams.sortBy,
    minHeight: mobileTheme.touchTargets.minTouchArea,
  },
  resultsSummary: {
    totalCount: state.totalResults,
    label: `${state.totalResults} professional contractors found`,
  },
  resultsList: state.results.map((pro) => ({
    id: pro.id,
    title: pro.businessName,
    category: pro.categoryName,
    city: pro.city,
    rating: pro.rating,
    reviewCount: pro.reviewCount,
    isVerified: pro.isVerified,
    skills: pro.skills,
    avatarUrl: pro.avatarUrl,
    minHeight: mobileTheme.touchTargets.buttonHeight,
  })),
  filterSheetModal: {
    isOpen: state.isFilterSheetOpen,
    verifiedOnly: state.searchParams.isVerifiedOnly,
    sortBy: state.searchParams.sortBy,
    applyButtonLabel: 'Apply Filters',
    clearButtonLabel: 'Clear All',
  },
  emptyState: !state.isLoading && state.results.length === 0 ? {
    message: 'No professional contractors match your search criteria.',
    suggestion: 'Try adjusting your search terms or expanding your location radius.',
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
