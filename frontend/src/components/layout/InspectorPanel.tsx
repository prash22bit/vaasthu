import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useUIStore } from '../../stores/uiStore';
import { PlotInspector } from '../inspector/PlotInspector';
import { EmptyInspector } from '../inspector/EmptyInspector';

export const InspectorPanel: React.FC = () => {
  const { selectedEntityId, selectedEntityType } = useCanvasStore();
  const { isInspectorCollapsed, toggleInspector } = useUIStore();

  const renderInspectorContent = () => {
    if (!selectedEntityId) return <EmptyInspector />;
    if (selectedEntityType === 'plot') return <PlotInspector />;
    return <EmptyInspector />;
  };

  return (
    <div
      className={`
        bg-panel-bg border-l border-panel-border flex flex-col shrink-0 relative
        transition-all duration-200 overflow-hidden
        ${isInspectorCollapsed ? 'w-8' : 'w-60'}
      `}
    >
      {/* Collapse toggle */}
      <button
        id="inspector-toggle-btn"
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                   bg-surface border border-panel-border z-10 flex items-center justify-center
                   hover:bg-surface-raised transition-colors"
        onClick={toggleInspector}
        title={isInspectorCollapsed ? 'Show Inspector' : 'Hide Inspector'}
      >
        {isInspectorCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {!isInspectorCollapsed && (
        <>
          {/* Panel header */}
          <div className="h-9 flex items-center px-3 border-b border-panel-border shrink-0">
            <span className="text-2xs font-semibold tracking-widest uppercase text-text-muted">
              Inspector
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {renderInspectorContent()}
          </div>
        </>
      )}
    </div>
  );
};
