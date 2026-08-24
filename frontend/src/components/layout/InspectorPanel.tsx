import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { PlotInspector } from '../inspector/PlotInspector';
import { WallInspector } from '../inspector/WallInspector';
import { RoomInspector } from '../inspector/RoomInspector';
import { DimensionInspector } from '../inspector/DimensionInspector';
import { DoorInspector } from '../inspector/DoorInspector';
import { WindowInspector } from '../inspector/WindowInspector';
import { StaircaseInspector } from '../inspector/StaircaseInspector';
import { ColumnInspector } from '../inspector/ColumnInspector';
import { ParkingInspector } from '../inspector/ParkingInspector';
import { GardenInspector } from '../inspector/GardenInspector';
import { CompoundWallInspector } from '../inspector/CompoundWallInspector';
import { GateInspector } from '../inspector/GateInspector';
import { MultiEntityInspector } from '../inspector/MultiEntityInspector';
import { EmptyInspector } from '../inspector/EmptyInspector';
import type {
  WallEntity,
  RoomEntity,
  DimensionEntity,
  DoorEntity,
  WindowEntity,
  StaircaseEntity,
  ColumnEntity,
  ParkingEntity,
  GardenEntity,
  CompoundWallEntity,
  GateEntity,
} from '@vastuplan/shared';

export const InspectorPanel: React.FC = () => {
  const { selectedEntityId, selectedEntityIds, selectedEntityType } = useCanvasStore();
  const { currentProject } = useProjectStore();
  const { isInspectorCollapsed, toggleInspector } = useUIStore();

  const floor = currentProject?.floors[0];
  const entities = floor?.entities || [];
  const unit = currentProject?.plot.unit || 'feet';

  const renderInspectorContent = () => {
    // 1. Multi-selection
    if (selectedEntityIds.length > 1) {
      const selectedEntities = entities.filter((e) => selectedEntityIds.includes(e.id));
      return <MultiEntityInspector entities={selectedEntities} />;
    }

    // 2. Single selection
    if (selectedEntityId === 'plot' || selectedEntityType === 'plot') {
      return <PlotInspector />;
    }

    if (selectedEntityId) {
      const entity = entities.find((e) => e.id === selectedEntityId);
      if (!entity) return <EmptyInspector />;

      if (entity.type === 'wall') {
        return <WallInspector wall={entity as unknown as WallEntity} unit={unit} />;
      }
      if (entity.type === 'room') {
        return <RoomInspector room={entity as unknown as RoomEntity} unit={unit} />;
      }
      if (entity.type === 'dimension') {
        return <DimensionInspector dimension={entity as unknown as DimensionEntity} unit={unit} />;
      }
      if (entity.type === 'door') {
        return <DoorInspector door={entity as unknown as DoorEntity} unit={unit} />;
      }
      if (entity.type === 'window') {
        return <WindowInspector windowEntity={entity as unknown as WindowEntity} unit={unit} />;
      }
      if (entity.type === 'staircase') {
        return <StaircaseInspector staircase={entity as unknown as StaircaseEntity} unit={unit} />;
      }
      if (entity.type === 'column') {
        return <ColumnInspector column={entity as unknown as ColumnEntity} unit={unit} />;
      }
      if (entity.type === 'parking') {
        return <ParkingInspector parking={entity as unknown as ParkingEntity} unit={unit} />;
      }
      if (entity.type === 'garden') {
        return <GardenInspector garden={entity as unknown as GardenEntity} unit={unit} />;
      }
      if (entity.type === 'compound-wall') {
        return <CompoundWallInspector compoundWall={entity as unknown as CompoundWallEntity} unit={unit} />;
      }
      if (entity.type === 'gate') {
        return <GateInspector gate={entity as unknown as GateEntity} unit={unit} />;
      }
    }

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
