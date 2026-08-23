// =============================================================================
// VastuPlan — AI Service (Phase 4 Architecture Stub)
//
// This module defines the architecture for the AI design assistant.
// The actual AI integration will be implemented in Phase 4.
//
// Architecture principles:
//   - AI communicates via structured commands, not direct DOM/state manipulation
//   - The design engine validates and applies commands — AI cannot bypass validation
//   - Commands are human-readable and loggable
// =============================================================================

import type { AICommand, AIResponse, Project } from '@vastuplan/shared';

// ---------------------------------------------------------------------------
// Command executor (stub)
// ---------------------------------------------------------------------------

/**
 * Execute an AI command against the design engine.
 * The AI should NOT directly manipulate state — it issues commands.
 * The design engine (geometry utils + stores) applies and validates them.
 *
 * Will be fully implemented in Phase 4.
 */
export async function executeAICommand(
  _command: AICommand,
  _project: Project
): Promise<{ success: boolean; message: string }> {
  // TODO (Phase 4): Route command to appropriate design engine action
  return {
    success: false,
    message: 'AI assistant is not yet available. Coming in Phase 4.',
  };
}

// ---------------------------------------------------------------------------
// Natural language to command translation (stub)
// ---------------------------------------------------------------------------

/**
 * Translate a natural language prompt to structured AI commands.
 * Will call an LLM API in Phase 4.
 *
 * Example prompt: "Add a 14x16 bedroom in the south-west"
 * Example response: [{ action: 'create_room', params: { width: 14, height: 16, zone: 'south-west', name: 'Bedroom' } }]
 */
export async function parseNaturalLanguage(
  _prompt: string,
  _project: Project
): Promise<AIResponse> {
  // TODO (Phase 4): Send prompt + project context to LLM, parse structured commands
  return {
    commands: [],
    explanation: 'AI assistant is not yet available. Coming in Phase 4.',
    confidence: 0,
  };
}

// ---------------------------------------------------------------------------
// Command validation
// ---------------------------------------------------------------------------

/**
 * Validate that an AI command is geometrically feasible.
 * The design engine always validates — AI commands cannot bypass this.
 */
export function validateAICommand(_command: AICommand, _project: Project): boolean {
  // TODO (Phase 4): Check that command parameters are within plot bounds,
  // don't overlap existing entities, respect Vastu constraints, etc.
  return false;
}
