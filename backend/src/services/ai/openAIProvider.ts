// =============================================================================
// VastuPlan — OpenAI Provider Implementation
//
// Implements the AIProvider interface using the OpenAI Chat Completions API.
// Compatible with any OpenAI-compatible endpoint (e.g. Azure OpenAI, local).
//
// Environment variables:
//   AI_API_KEY  — OpenAI API key (required)
//   AI_MODEL   — Model name (default: gpt-4o-mini)
//   AI_BASE_URL — Optional base URL override
// =============================================================================

import type { AIProvider, AIMessage, AIProviderConfig } from './aiProvider';

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatChoice {
  message: { role: string; content: string | null };
  finish_reason: string;
}

interface OpenAIChatResponse {
  id: string;
  choices: OpenAIChatChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature ?? 0.4;
  }

  async generate(systemPrompt: string, messages: AIMessage[]): Promise<string> {
    const chatMessages: OpenAIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: chatMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'text' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `OpenAI API error (${response.status}): ${errorBody.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as OpenAIChatResponse;

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    return content;
  }
}
