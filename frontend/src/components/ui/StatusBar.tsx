import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { SaveStatus } from '@vastuplan/shared';
import { Loader2, Check, AlertCircle, Edit3 } from 'lucide-react';

const statusConfig: Record<SaveStatus, { label: string; className: string; icon: React.ReactNode }> = {
  saved: {
    label: 'Saved',
    className: 'text-success',
    icon: <Check size={11} />,
  },
  saving: {
    label: 'Saving…',
    className: 'text-text-muted',
    icon: <Loader2 size={11} className="animate-spin" />,
  },
  unsaved: {
    label: 'Unsaved changes',
    className: 'text-warning',
    icon: <Edit3 size={11} />,
  },
  error: {
    label: 'Save failed',
    className: 'text-error',
    icon: <AlertCircle size={11} />,
  },
};

interface StatusBarProps {
  plotInfo?: {
    width: number;
    length: number;
    unit: string;
    facing: string;
    area: number;
  };
  zoom?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ plotInfo, zoom }) => {
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const config = statusConfig[saveStatus];

  return (
    <div className="h-7 bg-panel-header border-t border-panel-border flex items-center px-4 gap-6 text-2xs font-mono-numbers no-select shrink-0">
      {/* Save status */}
      <div className={`flex items-center gap-1.5 ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>

      <div className="w-px h-3.5 bg-panel-border" />

      {/* Plot info */}
      {plotInfo ? (
        <>
          <span className="text-text-secondary">
            <span className="text-text-muted mr-1">Plot:</span>
            {plotInfo.width} × {plotInfo.length} {plotInfo.unit === 'feet' ? 'ft' : 'm'}
          </span>
          <span className="text-text-secondary">
            <span className="text-text-muted mr-1">Facing:</span>
            {plotInfo.facing.charAt(0).toUpperCase() + plotInfo.facing.slice(1).replace(/-/g, ' ')}
          </span>
          <span className="text-text-secondary">
            <span className="text-text-muted mr-1">Area:</span>
            {plotInfo.area.toFixed(0)} {plotInfo.unit === 'feet' ? 'sq.ft' : 'm²'}
          </span>
          <span className="text-text-secondary">
            <span className="text-text-muted mr-1">Objects:</span>
            {useProjectStore.getState().currentProject?.floors[0]?.entities.length || 0}
          </span>
        </>
      ) : (
        <span className="text-text-muted">No project open</span>
      )}

      <div className="flex-1" />

      {/* Zoom level */}
      {zoom !== undefined && (
        <span className="text-text-muted">
          {Math.round(zoom * 100)}%
        </span>
      )}
    </div>
  );
};
