// =============================================================================
// VastuPlan — AI Service
//
// Client-side API caller for the AI design assistant.
// Communicates with backend POST /api/ai/chat.
// Handles timeouts, network errors, and normalizes responses.
// =============================================================================

import axios, { AxiosError } from 'axios';
import type {
  AIChatRequest,
  AIChatResponse,
  ApiSuccess,
  ApiError,
} from '@vastuplan/shared';
import { API_BASE_URL } from '../../constants';

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds for LLM generation
  headers: { 'Content-Type': 'application/json' },
});

export async function sendChatMessage(
  request: AIChatRequest
): Promise<AIChatResponse> {
  try {
    const res = await aiApi.post<ApiSuccess<AIChatResponse>>('/ai/chat', request);
    if (res.data && res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Invalid response structure from AI service');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<ApiError>;
      if (axiosErr.response?.data?.error) {
        throw new Error(axiosErr.response.data.error);
      }
      if (axiosErr.code === 'ECONNABORTED') {
        throw new Error('AI request timed out. The model took too long to respond.');
      }
      if (axiosErr.response?.status === 503) {
        throw new Error('AI assistant is currently unavailable. (AI_API_KEY not configured on backend)');
      }
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to communicate with AI service'
    );
  }
}
