import React from 'react';
import {
  MousePointer2, Hand, Minus, Square, DoorOpen,
  AppWindow, Ruler, Lock
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Tooltip } from '../ui/Tooltip';
import type { ToolId } from '../../constants';
import { TOOLS } from '../../constants';

const ICON_MAP: Record<string, React.ReactNode> = {
  MousePointer: <MousePointer2 size={16} />,
  Hand: <Hand size={16} />,
  Minus: <Minus size={16} />,
  Square: <Square size={16} />,
  DoorOpen: <DoorOpen size={16} />,
  AppWindow: <AppWindow size={16} />,
  Ruler: <Ruler size={16} />,
};

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, isToolbarCollapsed } = useUIStore();

  if (isToolbarCollapsed) return null;

  return (
    <div className="w-14 bg-panel-bg border-r border-panel-border flex flex-col items-center py-2 gap-0.5 shrink-0 overflow-y-auto no-select">
      {/* Tools */}
      {TOOLS.map((tool) => (
        <Tooltip key={tool.id} content={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`} side="right">
          <button
            id={`toolbar-${tool.id}`}
            className={`tool-btn w-12 ${activeTool === tool.id ? 'active' : ''} ${tool.disabled ? 'opacity-40' : ''}`}
            onClick={() => !tool.disabled && setActiveTool(tool.id as ToolId)}
            disabled={tool.disabled}
            aria-label={tool.label}
          >
            {ICON_MAP[tool.icon] ?? <Square size={16} />}
            <span className="text-2xs leading-none">{tool.label}</span>
            {tool.disabled && (
              <span className="absolute top-0.5 right-0.5">
                <Lock size={7} className="text-text-muted opacity-50" />
              </span>
            )}
          </button>
        </Tooltip>
      ))}

      <div className="flex-1" />

      {/* Phase indicator */}
      <div className="text-2xs text-text-muted text-center px-1 pb-1 leading-tight opacity-50">
        Phase<br />1
      </div>
    </div>
  );
};
