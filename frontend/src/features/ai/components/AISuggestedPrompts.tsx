import React from 'react';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface AISuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  'Where is my kitchen?',
  'Why is my kitchen getting a Vastu warning?',
  'Move my kitchen to Southeast',
  'Improve my layout according to Vastu',
  'Add a 12x14 bedroom in Southwest',
  'Make the living room larger',
];

export const AISuggestedPrompts: React.FC<AISuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-text-muted text-2xs font-semibold uppercase tracking-wider">
        <Sparkles size={12} className="text-brand-400" />
        <span>Suggested Prompts</span>
      </div>

      <div className="space-y-1.5">
        {SUGGESTIONS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="w-full text-left p-2 rounded-lg bg-surface/60 border border-panel-border
                       hover:bg-surface hover:border-brand-500/40 text-text-secondary hover:text-text-primary
                       text-2xs transition-all flex items-center justify-between group"
          >
            <span>{prompt}</span>
            <ArrowRight
              size={11}
              className="text-text-muted group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
