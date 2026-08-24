// =============================================================================
// VastuPlan — AI Provider Interface
//
// All LLM providers must implement this interface.
// The rest of the application depends only on this abstraction.
// =============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  /** Optional base URL override (for proxies, local models, etc.) */
  baseUrl?: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Temperature for response randomness (0–2) */
  temperature?: number;
}

/**
 * Abstract interface for LLM providers.
 * Implementations: OpenAIProvider (Phase 5), future: GeminiProvider, AnthropicProvider
 */
export interface AIProvider {
  /** Provider name for logging */
  readonly name: string;

  /**
   * Generate a text completion from the LLM.
   *
   * @param systemPrompt - System-level instructions (architecture, constraints, output format)
   * @param messages - Conversation history (user + assistant turns)
   * @returns Raw text response from the LLM
   * @throws Error if the provider is unavailable or returns an error
   */
  generate(
    systemPrompt: string,
    messages: AIMessage[]
  ): Promise<string>;
}
