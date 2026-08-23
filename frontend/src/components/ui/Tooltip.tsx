import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'right' }) => {
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), 400);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && content && (
        <div
          className={`
            absolute z-50 pointer-events-none whitespace-nowrap
            ${positionClasses[side]}
            bg-surface-overlay text-text-primary text-2xs font-medium
            px-2 py-1 rounded border border-panel-border
            shadow-panel animate-fade-in
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};
