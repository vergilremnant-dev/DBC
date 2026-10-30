import { axiosClient } from '../auth/axiosClient';
import type {
  ProviderSearchParams,
  SearchProvidersResponse,
  GlobalSearchResponse,
  SearchSuggestions,
} from '../../types/search/searchTypes';

const searchCache: Record<string, SearchProvidersResponse> = {};

export const searchApi = {
  /** Typeahead suggestions (services via synonyms/partial/spelling matching, professionals, locations). */
  async getSuggestions(q: string, signal?: AbortSignal): Promise<SearchSuggestions> {
    const response = await axiosClient.get<{ success: boolean; suggestions: SearchSuggestions }>('/api/search/suggestions', {
      params: { q },
      signal,
    });
    return response.data.suggestions;
  },

  async searchProviders(params: ProviderSearchParams): Promise<SearchProvidersResponse> {
    const cacheKey = JSON.stringify(params);
    if (searchCache[cacheKey]) {
      return searchCache[cacheKey];
    }
    const response = await axiosClient.get<SearchProvidersResponse>('/api/search/providers', {
      params,
    });
    searchCache[cacheKey] = response.data;
    return response.data;
  },

  async globalSearch(query: string): Promise<GlobalSearchResponse> {
    const response = await axiosClient.get<GlobalSearchResponse>('/api/search', {
      params: { q: query },
    });
    return response.data;
  },

  async getFeaturedProviders(limit = 5): Promise<SearchProvidersResponse> {
    const response = await axiosClient.get<SearchProvidersResponse>('/api/search/featured', {
      params: { limit },
    });
    return response.data;
  },

  async getRecommendedProviders(limit = 5): Promise<SearchProvidersResponse> {
    const response = await axiosClient.get<SearchProvidersResponse>('/api/search/recommended', {
      params: { limit },
    });
    return response.data;
  },
};
