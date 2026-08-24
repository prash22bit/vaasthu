import React from 'react';
import {
  MousePointer2,
  Hand,
  Minus,
  Square,
  DoorOpen,
  AppWindow,
  DoorClosed,
  Ruler,
  Columns,
  Shield,
  Car,
  Trees,
  Footprints,
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
  Columns: <Columns size={16} />,
  Shield: <Shield size={16} />,
  DoorOpen: <DoorOpen size={16} />,
  AppWindow: <AppWindow size={16} />,
  DoorClosed: <DoorClosed size={16} />,
  Car: <Car size={16} />,
  Trees: <Trees size={16} />,
  Footprints: <Footprints size={16} />,
  Ruler: <Ruler size={16} />,
};

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, isToolbarCollapsed } = useUIStore();

  if (isToolbarCollapsed) return null;

  return (
    <div className="w-14 bg-panel-bg border-r border-panel-border flex flex-col items-center py-2 gap-1 shrink-0 overflow-y-auto no-select">
      {/* Tools List */}
      {TOOLS.map((tool) => (
        <Tooltip
          key={tool.id}
          content={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          side="right"
        >
          <button
            id={`toolbar-${tool.id}`}
            className={`tool-btn w-12 flex flex-col items-center justify-center p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors ${
              activeTool === tool.id ? 'active bg-brand-500/20 text-brand-400 font-semibold' : ''
            }`}
            onClick={() => setActiveTool(tool.id as ToolId)}
            aria-label={tool.label}
          >
            {ICON_MAP[tool.icon] ?? <Square size={16} />}
            <span className="text-[10px] leading-none mt-1">{tool.label}</span>
          </button>
        </Tooltip>
      ))}

      <div className="flex-1" />

      {/* Phase indicator */}
      <div className="text-2xs text-brand-400 font-semibold text-center px-1 pb-1 leading-tight opacity-70">
        Phase<br />3
      </div>
    </div>
  );
};
