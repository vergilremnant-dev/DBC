/**
 * Mobile Professional Profile Screen Component & Controller for DBC Mobile Application.
 * Displays partner bio, verified badge, category, ratings/reviews, portfolio gallery,
 * and primary action CTA: "Start Project Request".
 */

import { mobileMarketplaceService } from '../../services/mobileMarketplaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileProfessional, ProjectRequestContext } from '../../types/marketplaceMobileTypes';

export interface ProfessionalProfileState {
  providerId: string;
  profile: MobileProfessional | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectedPortfolioIndex: number;
}

export class ProfessionalProfileController {
  private state: ProfessionalProfileState;

  constructor(providerId: string = '') {
    this.state = {
      providerId,
      profile: null,
      isLoading: false,
      errorMessage: null,
      selectedPortfolioIndex: 0,
    };
  }

  getState(): ProfessionalProfileState {
    return { ...this.state };
  }

  setSelectedPortfolioIndex(index: number) {
    this.state.selectedPortfolioIndex = index;
  }

  async loadProfile(id?: string): Promise<void> {
    const targetId = id || this.state.providerId;
    if (!targetId) return;

    this.state.providerId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.profile = await mobileMarketplaceService.getProfessionalProfile(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load professional profile';
    } finally {
      this.state.isLoading = false;
    }
  }

  getProjectRequestContext(): ProjectRequestContext {
    const p = this.state.profile;
    return {
      providerId: this.state.providerId,
      providerName: p?.businessName || 'Professional Partner',
      categoryId: p?.categoryId,
      categoryName: p?.categoryName || 'General Construction',
      city: p?.city || 'Hyderabad',
    };
  }
}

export const renderProfessionalProfileScreenDescriptor = (state: ProfessionalProfileState) => ({
  type: 'Screen',
  name: 'ProfessionalProfileScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    paddingHorizontal: mobileTheme.spacing.md,
  },
  header: {
    title: state.profile?.businessName || 'Professional Profile',
    isVerified: state.profile?.isVerified ?? true,
    rating: state.profile?.rating ?? 4.8,
    reviewCount: state.profile?.reviewCount ?? 12,
    city: state.profile?.city || 'Pan India',
    category: state.profile?.categoryName || 'General Construction',
    avatarUrl: state.profile?.avatarUrl,
  },
  bioSection: {
    title: 'About the Professional',
    text: state.profile?.bio || state.profile?.tagline || 'Licensed construction contractor partner.',
  },
  skillsSection: {
    title: 'Expertise & Capabilities',
    skills: state.profile?.skills || [],
  },
  portfolioGallery: {
    title: 'Past Completed Work Portfolio',
    images: state.profile?.portfolioImages || [],
    selectedIndex: state.selectedPortfolioIndex,
  },
  primaryCtaBar: {
    label: 'Start Project Request',
    minHeight: mobileTheme.touchTargets.buttonHeight,
    backgroundColor: mobileTheme.colors.primary,
  },
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
