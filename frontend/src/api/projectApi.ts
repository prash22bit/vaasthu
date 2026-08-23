import axios, { AxiosError } from 'axios';
import type { Project, CreateProjectPayload, UpdateProjectPayload, ApiSuccess } from '@vastuplan/shared';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Response interceptor — normalize error messages
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Project API
// ---------------------------------------------------------------------------

export const projectApi = {
  /** GET /api/projects */
  async getAll(): Promise<Project[]> {
    const res = await api.get<ApiSuccess<Project[]>>('/projects');
    return res.data.data;
  },

  /** GET /api/projects/:id */
  async getById(id: string): Promise<Project> {
    const res = await api.get<ApiSuccess<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  /** POST /api/projects */
  async create(payload: CreateProjectPayload): Promise<Project> {
    const res = await api.post<ApiSuccess<Project>>('/projects', payload);
    return res.data.data;
  },

  /** PUT /api/projects/:id */
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const res = await api.put<ApiSuccess<Project>>(`/projects/${id}`, payload);
    return res.data.data;
  },

  /** DELETE /api/projects/:id */
  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};

/** GET /api/health */
export async function checkHealth(): Promise<{ connected: boolean }> {
  try {
    const res = await api.get('/health');
    return { connected: res.data?.data?.database?.connected ?? false };
  } catch {
    return { connected: false };
  }
}
