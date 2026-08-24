import React from 'react';
import type { AIChatMessage as AIChatMessageType } from '@vastuplan/shared';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import { AIProposalCard } from './AIProposalCard';

interface AIChatMessageProps {
  message: AIChatMessageType;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-3xs text-success font-medium">
        <CheckCircle2 size={12} />
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`
          w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
          ${isUser ? 'bg-brand-600 text-white' : 'bg-surface border border-panel-border text-brand-400'}
        `}
      >
        {isUser ? <User size={11} /> : <Bot size={11} />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            p-2.5 rounded-lg text-xs leading-relaxed break-words
            ${
              isUser
                ? 'bg-brand-600 text-white rounded-tr-none'
                : 'bg-surface border border-panel-border text-text-primary rounded-tl-none'
            }
          `}
        >
          {message.content}
        </div>

        {/* Embedded proposal card if present */}
        {message.proposal && (
          <div className="w-full">
            <AIProposalCard proposal={message.proposal} />
          </div>
        )}
      </div>
    </div>
  );
};
