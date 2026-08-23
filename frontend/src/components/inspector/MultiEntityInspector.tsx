import React from 'react';
import type { DesignEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { alignEntities } from '../../utils/geometry';
import { AlignLeft, AlignRight, AlignStartVertical, AlignEndVertical, AlignCenterHorizontal, AlignCenterVertical } from 'lucide-react';

interface MultiEntityInspectorProps {
  entities: DesignEntity[];
}

export const MultiEntityInspector: React.FC<MultiEntityInspectorProps> = ({ entities }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const handleAlign = (
    type: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => {
    const before = [...(currentProject?.floors[0]?.entities || [])];
    const aligned = alignEntities(entities, type);

    aligned.forEach((e) => {
      updateEntity(e.id, { position: e.position });
    });

    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(
      createHistoryAction('MOVE_ENTITY', before, after, `Align ${entities.length} objects (${type})`)
    );
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Multi-Selection
        </span>
        <p className="text-text-primary text-xs font-medium mt-0.5">
          {entities.length} objects selected
        </p>
      </div>

      {/* Alignment Actions */}
      <div className="space-y-3">
        <span className="inspector-label">CAD Alignment Helpers</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('left')}
            title="Align Left"
          >
            <AlignLeft size={13} />
            <span>Left</span>
          </button>
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('center-h')}
            title="Align Horizontal Center"
          >
            <AlignCenterHorizontal size={13} />
            <span>Center H</span>
          </button>
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('right')}
            title="Align Right"
          >
            <AlignRight size={13} />
            <span>Right</span>
          </button>
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('top')}
            title="Align Top"
          >
            <AlignStartVertical size={13} />
            <span>Top</span>
          </button>
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('center-v')}
            title="Align Vertical Center"
          >
            <AlignCenterVertical size={13} />
            <span>Center V</span>
          </button>
          <button
            className="btn btn-secondary btn-xs gap-1 justify-center"
            onClick={() => handleAlign('bottom')}
            title="Align Bottom"
          >
            <AlignEndVertical size={13} />
            <span>Bottom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
