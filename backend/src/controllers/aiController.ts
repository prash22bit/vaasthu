// =============================================================================
// VastuPlan — AI Controller
//
// Handles POST /api/ai/chat requests.
// Validates input, calls the AI LLM service, returns structured response.
// Never executes design commands — only generates suggestions.
// =============================================================================

import { Request, Response } from 'express';
import type { AIChatRequest } from '@vastuplan/shared';
import { processAIChatRequest, getAIProvider } from '../services/ai/aiLLMService';

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONVERSATION_HISTORY = 20;
const MAX_ENTITIES = 500;
const MAX_CONTEXT_SIZE_BYTES = 500_000; // 500 KB

// ── Controller ──────────────────────────────────────────────────────────────

export async function chat(req: Request, res: Response): Promise<void> {
  try {
    // 1. Check provider availability
    const provider = getAIProvider();
    if (!provider) {
      res.status(503).json({
        success: false,
        error: 'AI assistant is currently unavailable. AI_API_KEY is not configured.',
        statusCode: 503,
      });
      return;
    }

    // 2. Validate request body
    const body = req.body as Partial<AIChatRequest>;

    if (!body.message || typeof body.message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string.',
        statusCode: 400,
      });
      return;
    }

    if (body.message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
        statusCode: 400,
      });
      return;
    }

    if (!body.context || typeof body.context !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Design context is required.',
        statusCode: 400,
      });
      return;
    }

    // 3. Validate context size
    const contextSize = JSON.stringify(body.context).length;
    if (contextSize > MAX_CONTEXT_SIZE_BYTES) {
      res.status(400).json({
        success: false,
        error: 'Design context is too large. Reduce the number of entities.',
        statusCode: 400,
      });
      return;
    }

    if (Array.isArray(body.context.entities) && body.context.entities.length > MAX_ENTITIES) {
      res.status(400).json({
        success: false,
        error: `Too many entities (${body.context.entities.length}). Maximum ${MAX_ENTITIES}.`,
        statusCode: 400,
      });
      return;
    }

    // 4. Limit conversation history
    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory.slice(-MAX_CONVERSATION_HISTORY)
      : [];

    // 5. Build the request
    const request: AIChatRequest = {
      message: body.message.trim(),
      context: body.context,
      conversationHistory,
    };

    // 6. Call AI service
    const response = await processAIChatRequest(request);

    // 7. Return response
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('[AI Controller] Error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    // Don't expose internal details
    const safeMessage = message.includes('API')
      ? 'The AI service encountered an error. Please try again.'
      : message;

    res.status(500).json({
      success: false,
      error: safeMessage,
      statusCode: 500,
    });
  }
}
