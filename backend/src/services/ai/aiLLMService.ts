// =============================================================================
// VastuPlan — AI LLM Service
//
// Orchestrates the AI pipeline:
//   1. Build system prompt from context
//   2. Call LLM provider
//   3. Parse and validate the response
//   4. Return typed AIChatResponse
//
// This module is the single entry point for AI generation.
// It never executes commands — it only generates suggestions.
// =============================================================================

import type { AIChatRequest, AIChatResponse, AICommand, AIProposal } from '@vastuplan/shared';
import type { AIProvider, AIMessage } from './aiProvider';
import { OpenAIProvider } from './openAIProvider';
import { buildSystemPrompt } from './aiPromptBuilder';

// ── Provider Factory ────────────────────────────────────────────────────────

let cachedProvider: AIProvider | null = null;

/**
 * Get or create the AI provider based on environment variables.
 * Returns null if AI is not configured.
 */
export function getAIProvider(): AIProvider | null {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.warn('[AI] AI_API_KEY not configured — AI features disabled');
    return null;
  }

  const providerName = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.AI_BASE_URL;

  switch (providerName) {
    case 'openai':
    default:
      cachedProvider = new OpenAIProvider({
        apiKey,
        model,
        baseUrl,
        maxTokens: 4096,
        temperature: 0.4,
      });
      console.log(`[AI] Provider: ${providerName}, Model: ${model}`);
      break;
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful for testing or config changes).
 */
export function resetAIProvider(): void {
  cachedProvider = null;
}

// ── Response Parsing ────────────────────────────────────────────────────────

// Patterns that indicate dangerous/executable content
const DANGEROUS_PATTERNS = [
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bnew\s+Function/i,
  /\brequire\s*\(/i,
  /\bimport\s*\(/i,
  /\bexec\s*\(/i,
  /\bspawn\s*\(/i,
  /\bchild_process/i,
  /\bprocess\.env/i,
  /\bmongoose\./i,
  /\bdb\./i,
  /\bdocument\./i,
  /\bwindow\./i,
  /```(javascript|typescript|js|ts|python|bash|sh|sql)/i,
];

function containsDangerousContent(text: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(text));
}

/**
 * Parse raw LLM output into a typed AIChatResponse.
 * Handles JSON extraction, validation, and sanitization.
 */
export function parseAIResponse(rawOutput: string): AIChatResponse {
  // Strip markdown code fences if present
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    cleaned = cleaned.slice(firstNewline + 1);
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }

  // Attempt JSON parse
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If LLM returned plain text, wrap it
    return {
      message: rawOutput.trim(),
      confidence: 0.5,
    };
  }

  // Reject dangerous content
  if (containsDangerousContent(JSON.stringify(parsed))) {
    return {
      message: 'I encountered an issue processing that request. Please try rephrasing.',
      confidence: 0,
    };
  }

  const message = typeof parsed.message === 'string' ? parsed.message : 'I was unable to process that request.';
  const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
  const requiresClarification = parsed.requiresClarification === true;

  // Parse proposal
  let proposal: AIProposal | undefined;
  if (parsed.proposal && typeof parsed.proposal === 'object' && !Array.isArray(parsed.proposal)) {
    const rawProposal = parsed.proposal as Record<string, unknown>;

    const commands: AICommand[] = [];
    if (Array.isArray(rawProposal.commands)) {
      for (const cmd of rawProposal.commands) {
        if (cmd && typeof cmd === 'object' && typeof (cmd as Record<string, unknown>).action === 'string') {
          const c = cmd as Record<string, unknown>;
          commands.push({
            id: typeof c.id === 'string' ? c.id : `cmd_${commands.length + 1}`,
            action: c.action as AICommand['action'],
            entityId: typeof c.entityId === 'string' ? c.entityId : undefined,
            entityType: typeof c.entityType === 'string' ? c.entityType as AICommand['entityType'] : undefined,
            params: c.params && typeof c.params === 'object' ? (c.params as Record<string, unknown>) : {},
            description: typeof c.description === 'string' ? c.description : 'AI-generated command',
            reason: typeof c.reason === 'string' ? c.reason : undefined,
            confidence: typeof c.confidence === 'number' ? c.confidence : undefined,
          });
        }
      }
    }

    if (commands.length > 0) {
      proposal = {
        id: `proposal_${Date.now()}`,
        title: typeof rawProposal.title === 'string' ? rawProposal.title : 'AI Proposal',
        explanation: typeof rawProposal.explanation === 'string' ? rawProposal.explanation : message,
        commands,
        validationErrors: [],
        warnings: [],
        status: 'pending-validation',
        createdAt: new Date().toISOString(),
      };
    }
  }

  return {
    message,
    proposal,
    confidence,
    requiresClarification,
  };
}

// ── Main Chat Function ──────────────────────────────────────────────────────

/**
 * Process an AI chat request: build prompt, call LLM, parse response.
 *
 * @throws Error if the provider is not configured or the LLM call fails
 */
export async function processAIChatRequest(request: AIChatRequest): Promise<AIChatResponse> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI provider is not configured. Set AI_API_KEY in the backend environment.');
  }

  // Build system prompt from context
  const systemPrompt = buildSystemPrompt(request.context);

  // Convert conversation history to provider messages
  const messages: AIMessage[] = [];

  // Include recent conversation history (limit to last 10 messages for context window)
  const recentHistory = request.conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add the current user message
  messages.push({
    role: 'user',
    content: request.message,
  });

  // Call the LLM
  const rawOutput = await provider.generate(systemPrompt, messages);

  // Parse and return
  return parseAIResponse(rawOutput);
}
