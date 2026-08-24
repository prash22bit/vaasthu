import React, { useRef, useEffect } from 'react';
import type { Project } from '@vastuplan/shared';
import { Bot, X, Trash2, Sparkles, ShieldAlert } from 'lucide-react';
import { useAIStore } from '../aiStore';
import { useCanvasStore } from '../../../stores/canvasStore';
import { useUIStore } from '../../../stores/uiStore';
import { AIContextSummary } from './AIContextSummary';
import { AIChatMessage } from './AIChatMessage';
import { AISuggestedPrompts } from './AISuggestedPrompts';
import { AIInput } from './AIInput';

interface AIAssistantPanelProps {
  project: Project;
  floorIndex?: number;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  project,
  floorIndex = 0,
}) => {
  const {
    messages,
    isGenerating,
    sendMessage,
    clearChat,
  } = useAIStore();

  const { setRightPanelContext } = useUIStore();
  const selectedEntityIds = useCanvasStore((s) => s.selectedEntityIds);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = (text: string) => {
    sendMessage(text, project, floorIndex, selectedEntityIds);
  };

  const handleClose = () => {
    setRightPanelContext('inspector');
  };

  return (
    <div
      className="bg-panel-bg border-l border-panel-border flex flex-col shrink-0 relative
                 w-80 h-full overflow-hidden shadow-lg z-10 transition-all duration-200"
    >
      {/* ── Panel Header ── */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-panel-border bg-panel-header shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-brand-600/20 text-brand-400 flex items-center justify-center">
            <Bot size={13} />
          </div>
          <span className="text-xs font-semibold text-text-primary tracking-tight">
            AI Assistant
          </span>
          <span className="text-3xs font-medium px-1.5 py-0.2 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="btn btn-ghost btn-icon w-6 h-6 text-text-muted hover:text-error"
              title="Clear Conversation"
            >
              <Trash2 size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-icon w-6 h-6 text-text-muted hover:text-text-primary"
            title="Close Assistant"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Architectural Context Summary ── */}
      <AIContextSummary project={project} floorIndex={floorIndex} />

      {/* ── Chat Messages & Suggestions ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4 px-2 space-y-1.5">
              <div className="w-9 h-9 rounded-full bg-brand-600/10 text-brand-400 flex items-center justify-center mx-auto mb-2 border border-brand-500/20">
                <Sparkles size={18} />
              </div>
              <h3 className="text-xs font-semibold text-text-primary">
                Design Assistant Ready
              </h3>
              <p className="text-2xs text-text-muted leading-relaxed max-w-[220px] mx-auto">
                Ask questions about your plan, request layout changes, or optimize for Vastu.
              </p>
            </div>

            <AISuggestedPrompts
              onSelectPrompt={handleSend}
              disabled={isGenerating}
            />
          </div>
        ) : (
          messages.map((msg) => (
            <AIChatMessage key={msg.id} message={msg} />
          ))
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ── Disclaimer ── */}
      <div className="px-3 py-1 bg-surface/30 border-t border-panel-border/50 text-3xs text-text-muted flex items-start gap-1">
        <ShieldAlert size={10} className="shrink-0 mt-0.5 text-text-muted" />
        <span className="leading-tight">
          AI suggestions are design assistance only. Verify architectural requirements with a professional.
        </span>
      </div>

      {/* ── Chat Input ── */}
      <AIInput
        onSendMessage={handleSend}
        isGenerating={isGenerating}
      />
    </div>
  );
};
