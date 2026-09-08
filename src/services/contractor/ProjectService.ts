import axios from 'axios';
import { axiosClient } from '../auth/axiosClient.js';
import type { Project, ProjectMilestone, WorkOrder, ProjectResource, ProgressLog } from '../../types/contractor/ProjectTypes.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export const ProjectService = {
  async listProjects(status?: string): Promise<Project[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Project[]>>('/api/projects', {
        params: { status },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to load projects'), { cause: error });
    }
  },

  async getProjectDetail(id: string): Promise<Project> {
    try {
      const response = await axiosClient.get<ApiResponse<Project>>(`/api/projects/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to load project details'), { cause: error });
    }
  },

  async updateProjectStatus(id: string, status: string, reason?: string): Promise<Project> {
    try {
      const response = await axiosClient.put<ApiResponse<Project>>(`/api/projects/${id}`, {
        status,
        reason,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to update project status'), { cause: error });
    }
  },

  async createWorkOrder(
    projectId: string,
    payload: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      estimatedHours?: number;
      assignedResourceId?: string;
      milestoneId?: string;
    }
  ): Promise<WorkOrder> {
    try {
      const response = await axiosClient.post<ApiResponse<WorkOrder>>(
        `/api/projects/${projectId}/work-orders`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create work order'), { cause: error });
    }
  },

  async createMilestone(
    projectId: string,
    payload: {
      name: string;
      description?: string;
      budgetAllocation?: number;
      plannedStart?: string;
      plannedEnd?: string;
    }
  ): Promise<ProjectMilestone> {
    try {
      const response = await axiosClient.post<ApiResponse<ProjectMilestone>>(
        `/api/projects/${projectId}/milestones`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create milestone'), { cause: error });
    }
  },

  async updateMilestone(
    projectId: string,
    payload: {
      milestoneId: string;
      name?: string;
      description?: string;
      budgetAllocation?: number;
      plannedStart?: string;
      plannedEnd?: string;
      status?: string;
      completionPercentage?: number;
    }
  ): Promise<ProjectMilestone> {
    try {
      const response = await axiosClient.put<ApiResponse<ProjectMilestone>>(
        `/api/projects/${projectId}/milestones`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to update milestone'), { cause: error });
    }
  },

  async deleteMilestone(projectId: string, milestoneId: string): Promise<{ success: boolean; id: string }> {
    try {
      const response = await axiosClient.delete<ApiResponse<{ success: boolean; id: string }>>(
        `/api/projects/${projectId}/milestones`,
        { data: { milestoneId } }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to delete milestone'), { cause: error });
    }
  },

  async assignResource(
    projectId: string,
    payload: {
      email: string;
      role?: string;
    }
  ): Promise<ProjectResource> {
    try {
      const response = await axiosClient.post<ApiResponse<ProjectResource>>(
        `/api/projects/${projectId}/resources`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to assign resource'), { cause: error });
    }
  },

  async addProgressLog(
    projectId: string,
    payload: {
      completionPercentage: number;
      notes: string;
      evidenceUrl?: string;
      reportType?: string;
    }
  ): Promise<ProgressLog> {
    try {
      const response = await axiosClient.post<ApiResponse<ProgressLog>>(
        `/api/projects/${projectId}/progress`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to submit progress log'), { cause: error });
    }
  },

  async requestApproval(
    projectId: string,
    payload: {
      targetType: string;
      targetId: string;
    }
  ): Promise<unknown> {
    try {
      const response = await axiosClient.post<ApiResponse<unknown>>(`/api/projects/${projectId}/approvals`, {
        action: 'REQUEST',
        ...payload,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to request approval'), { cause: error });
    }
  },

  async resolveApproval(
    projectId: string,
    payload: {
      approvalId: string;
      isApproved: boolean;
      remarks?: string;
    }
  ): Promise<unknown> {
    try {
      const response = await axiosClient.post<ApiResponse<unknown>>(`/api/projects/${projectId}/approvals`, {
        action: 'RESOLVE',
        ...payload,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to resolve approval'), { cause: error });
    }
  },
};
