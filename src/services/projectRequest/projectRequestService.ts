import axios from 'axios';
import { axiosClient } from '../auth/axiosClient';
import type { RequirementStatus } from '../../types/customer/RequirementTypes';

export interface ProjectRequestPayload {
  serviceCategoryId: number;
  providerId?: string | null;
  title: string;
  description: string;
  siteAddress: string;
  city: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredStartDate?: string | null;
  details?: Record<string, string>;
  attachments?: Array<{ fileName: string; fileUrl: string; fileType: string }>;
}

export interface ProjectRequestSubmitted {
  id: number;
  reference: string;
  status: RequirementStatus;
  conversationId: string | null;
  duplicate: boolean;
}

/** A request as a professional sees it (limited customer data until engaged). */
export interface ProviderRequestView {
  id: number;
  reference: string;
  title: string;
  description: string;
  serviceCategory: string;
  serviceCategoryId: number | null;
  status: RequirementStatus;
  budgetMin: number;
  budgetMax: number;
  preferredStartDate: string | null;
  createdAt: string;
  city: string;
  location: string;
  customer: { displayName: string };
  attachments: Array<{ id: number; fileName: string; fileUrl: string; fileType: string }>;
  invited: boolean;
  engaged: boolean;
  myQuotation?: { id: number; status: string; totalAmount: number } | null;
  conversationId?: string | null;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public fields?: Record<string, string>) {
    super(message);
  }
}

export function toApiError(err: unknown, fallback: string): ApiError {
  if (err instanceof ApiError) return err; // already normalised (keeps the HTTP status)
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; fields?: Record<string, string> } | undefined;
    return new ApiError(data?.message || (err.response ? fallback : 'Network error. Check your connection and try again.'), err.response?.status, data?.fields);
  }
  return new ApiError(err instanceof Error ? err.message : fallback);
}

export const projectRequestApi = {
  async submit(payload: ProjectRequestPayload): Promise<ProjectRequestSubmitted> {
    try {
      const res = await axiosClient.post<{ data: ProjectRequestSubmitted }>('/api/project-requests', payload);
      return res.data.data;
    } catch (err) {
      throw toApiError(err, 'Could not submit your request.');
    }
  },
  async inbox(scope: 'invited' | 'open'): Promise<ProviderRequestView[]> {
    try {
      const res = await axiosClient.get<{ data: ProviderRequestView[] }>('/api/project-requests', { params: { scope } });
      return res.data.data;
    } catch (err) {
      throw toApiError(err, 'Could not load requests.');
    }
  },
  async action(id: number, action: 'acknowledge' | 'contact'): Promise<{ conversationId?: string }> {
    try {
      const res = await axiosClient.post<{ data: { conversationId?: string } }>(`/api/project-requests/${id}`, { action });
      return res.data.data;
    } catch (err) {
      throw toApiError(err, 'Action failed.');
    }
  },
  /** GET /api/requirements/:id — shaped by the server for the viewer (customer, professional or admin). */
  async get<T = unknown>(id: number): Promise<T> {
    try {
      const res = await axiosClient.get<{ data: T }>(`/api/requirements/${id}`);
      return res.data.data;
    } catch (err) {
      throw toApiError(err, 'Could not load this request.');
    }
  },
  async cancel(id: number, reason?: string) {
    try {
      await axiosClient.put(`/api/requirements/${id}/status`, { status: 'CANCELLED', reason });
    } catch (err) {
      throw toApiError(err, 'Could not cancel this request.');
    }
  },
};
