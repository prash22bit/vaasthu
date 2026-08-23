import React from 'react';
import { MousePointer2 } from 'lucide-react';

export const EmptyInspector: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-3 opacity-60">
      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
        <MousePointer2 size={18} className="text-text-muted" />
      </div>
      <div>
        <p className="text-text-secondary text-xs font-medium mb-1">Nothing selected</p>
        <p className="text-text-muted text-2xs leading-relaxed">
          Click the plot on the canvas to see its properties here.
        </p>
      </div>
    </div>
  );
};
