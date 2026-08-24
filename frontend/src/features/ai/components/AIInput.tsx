import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface AIInputProps {
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({
  onSendMessage,
  isGenerating,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isGenerating || disabled) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  return (
    <div className="p-2.5 bg-panel-header border-t border-panel-border shrink-0">
      <div className="flex items-end gap-1.5 bg-surface rounded-lg border border-panel-border focus-within:border-brand-500/60 p-1.5 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? 'Thinking…' : 'Ask about your design or request changes…'}
          disabled={isGenerating || disabled}
          rows={1}
          className="flex-1 bg-transparent border-0 resize-none text-xs text-text-primary placeholder:text-text-muted
                     focus:outline-none max-h-24 py-1 px-1.5 leading-relaxed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isGenerating || disabled}
          className="btn btn-primary btn-icon w-7 h-7 shrink-0 rounded-md disabled:opacity-30"
          title="Send (Enter)"
        >
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between text-3xs text-text-muted px-1">
        <span>Enter to send · Shift+Enter for new line</span>
        {isGenerating && <span className="text-brand-400 animate-pulse">Generating proposal…</span>}
      </div>
    </div>
  );
};
