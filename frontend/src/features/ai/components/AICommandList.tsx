import React from 'react';
import type { AICommand } from '@vastuplan/shared';
import {
  Square,
  Minus,
  DoorOpen,
  AppWindow,
  Footprints,
  Columns,
  Car,
  Trees,
  Shield,
  DoorClosed,
  Move,
  Maximize2,
  RotateCw,
  Trash2,
  Copy,
  Sliders,
} from 'lucide-react';

interface AICommandListProps {
  commands: AICommand[];
}

function getActionIcon(action: AICommand['action']) {
  switch (action) {
    case 'create_room':
      return <Square size={12} className="text-brand-400" />;
    case 'create_wall':
      return <Minus size={12} className="text-brand-400" />;
    case 'create_door':
      return <DoorOpen size={12} className="text-amber-400" />;
    case 'create_window':
      return <AppWindow size={12} className="text-cyan-400" />;
    case 'create_staircase':
      return <Footprints size={12} className="text-purple-400" />;
    case 'create_column':
      return <Columns size={12} className="text-slate-400" />;
    case 'create_parking':
      return <Car size={12} className="text-blue-400" />;
    case 'create_garden':
      return <Trees size={12} className="text-emerald-400" />;
    case 'create_compound_wall':
      return <Shield size={12} className="text-indigo-400" />;
    case 'create_gate':
      return <DoorClosed size={12} className="text-orange-400" />;
    case 'move_entity':
      return <Move size={12} className="text-blue-400" />;
    case 'resize_entity':
      return <Maximize2 size={12} className="text-emerald-400" />;
    case 'rotate_entity':
      return <RotateCw size={12} className="text-amber-400" />;
    case 'delete_entity':
      return <Trash2 size={12} className="text-error" />;
    case 'duplicate_entity':
      return <Copy size={12} className="text-indigo-400" />;
    case 'update_entity_properties':
      return <Sliders size={12} className="text-text-muted" />;
    default:
      return <Square size={12} className="text-text-muted" />;
  }
}

export const AICommandList: React.FC<AICommandListProps> = ({ commands }) => {
  return (
    <div className="space-y-1 mt-2">
      <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
        Proposed Changes ({commands.length})
      </span>
      <div className="space-y-1">
        {commands.map((cmd) => (
          <div
            key={cmd.id}
            className="flex items-start gap-2 p-1.5 rounded bg-surface/60 border border-panel-border text-xs"
          >
            <div className="mt-0.5 shrink-0">{getActionIcon(cmd.action)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-2xs font-medium leading-tight truncate">
                {cmd.description}
              </p>
              {cmd.reason && (
                <p className="text-text-muted text-3xs mt-0.5 leading-snug">
                  {cmd.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
