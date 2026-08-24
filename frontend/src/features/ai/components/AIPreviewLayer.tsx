// =============================================================================
// VastuPlan — AI Proposal Preview Layer (Konva)
//
// Renders a visual ghost overlay on the CAD canvas showing proposed changes:
//   - Added entities: bright dashed outline + translucent fill
//   - Moved entities: old position ghost + movement vector line + new position ghost
//   - Resized entities: dashed outline of proposed dimensions
//   - Deleted entities: red strikethrough / red translucent overlay
//
// Uses the EXACT canvas coordinate system: WorldPoint * BASE_PIXELS_PER_UNIT.
// =============================================================================

import React from 'react';
import { Group, Rect, Line, Text, Arrow } from 'react-konva';
import { BASE_PIXELS_PER_UNIT } from '../../../constants';
import { useAIStore } from '../aiStore';

interface AIPreviewLayerProps {
  zoom: number;
}

export const AIPreviewLayer: React.FC<AIPreviewLayerProps> = ({ zoom }) => {
  const { activeProposal, previewResult, isPreviewVisible } = useAIStore();

  if (
    !activeProposal ||
    activeProposal.status !== 'valid' ||
    !previewResult ||
    !isPreviewVisible
  ) {
    return null;
  }

  const { diffs, previewProject } = previewResult;

  return (
    <Group listening={false}>
      {diffs.map((diff) => {
        // ── 1. Added Entities ──
        if (diff.changeType === 'added' && diff.after?.position && diff.after?.dimensions) {
          const x = diff.after.position.x * BASE_PIXELS_PER_UNIT;
          const y = diff.after.position.y * BASE_PIXELS_PER_UNIT;
          const w = diff.after.dimensions.width * BASE_PIXELS_PER_UNIT;
          const h = diff.after.dimensions.height * BASE_PIXELS_PER_UNIT;

          return (
            <Group key={`preview_add_${diff.id}`}>
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(56, 189, 248, 0.18)"
                stroke="#38bdf8"
                strokeWidth={2 / zoom}
                dash={[6 / zoom, 3 / zoom]}
                cornerRadius={2 / zoom}
              />
              <Text
                x={x + 4 / zoom}
                y={y + 4 / zoom}
                text={`+ ${diff.name || diff.type} (Proposed)`}
                fontSize={10 / zoom}
                fill="#38bdf8"
                fontStyle="bold"
                fontFamily="'Inter', sans-serif"
              />
            </Group>
          );
        }

        // ── 2. Moved Entities ──
        if (
          diff.changeType === 'moved' &&
          diff.before?.position &&
          diff.after?.position
        ) {
          const entity = previewProject.floors[0]?.entities.find((e) => e.id === diff.id);
          const w = (entity?.dimensions?.width || 10) * BASE_PIXELS_PER_UNIT;
          const h = (entity?.dimensions?.height || 10) * BASE_PIXELS_PER_UNIT;

          const oldX = diff.before.position.x * BASE_PIXELS_PER_UNIT;
          const oldY = diff.before.position.y * BASE_PIXELS_PER_UNIT;
          const newX = diff.after.position.x * BASE_PIXELS_PER_UNIT;
          const newY = diff.after.position.y * BASE_PIXELS_PER_UNIT;

          return (
            <Group key={`preview_move_${diff.id}`}>
              {/* Old position ghost */}
              <Rect
                x={oldX}
                y={oldY}
                width={w}
                height={h}
                fill="rgba(148, 163, 184, 0.08)"
                stroke="#94a3b8"
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />

              {/* Movement Arrow */}
              <Arrow
                points={[oldX + w / 2, oldY + h / 2, newX + w / 2, newY + h / 2]}
                stroke="#38bdf8"
                fill="#38bdf8"
                strokeWidth={2 / zoom}
                pointerLength={8 / zoom}
                pointerWidth={6 / zoom}
                dash={[4 / zoom, 2 / zoom]}
              />

              {/* New position ghost */}
              <Rect
                x={newX}
                y={newY}
                width={w}
                height={h}
                fill="rgba(56, 189, 248, 0.2)"
                stroke="#38bdf8"
                strokeWidth={2.5 / zoom}
                dash={[6 / zoom, 3 / zoom]}
              />
              <Text
                x={newX + 4 / zoom}
                y={newY + 4 / zoom}
                text={`↗ ${diff.name || diff.type} (New Position)`}
                fontSize={10 / zoom}
                fill="#38bdf8"
                fontStyle="bold"
                fontFamily="'Inter', sans-serif"
              />
            </Group>
          );
        }

        // ── 3. Resized Entities ──
        if (diff.changeType === 'resized' && diff.after?.dimensions) {
          const entity = previewProject.floors[0]?.entities.find((e) => e.id === diff.id);
          const x = (entity?.position?.x || 0) * BASE_PIXELS_PER_UNIT;
          const y = (entity?.position?.y || 0) * BASE_PIXELS_PER_UNIT;
          const newW = diff.after.dimensions.width * BASE_PIXELS_PER_UNIT;
          const newH = diff.after.dimensions.height * BASE_PIXELS_PER_UNIT;

          return (
            <Group key={`preview_resize_${diff.id}`}>
              <Rect
                x={x}
                y={y}
                width={newW}
                height={newH}
                fill="rgba(16, 185, 129, 0.15)"
                stroke="#10b981"
                strokeWidth={2 / zoom}
                dash={[6 / zoom, 3 / zoom]}
              />
              <Text
                x={x + 4 / zoom}
                y={y + 4 / zoom}
                text={`↔ ${diff.name || diff.type} (Resized)`}
                fontSize={10 / zoom}
                fill="#10b981"
                fontStyle="bold"
                fontFamily="'Inter', sans-serif"
              />
            </Group>
          );
        }

        // ── 4. Removed Entities ──
        if (diff.changeType === 'removed' && diff.before?.position && diff.before?.dimensions) {
          const x = diff.before.position.x * BASE_PIXELS_PER_UNIT;
          const y = diff.before.position.y * BASE_PIXELS_PER_UNIT;
          const w = diff.before.dimensions.width * BASE_PIXELS_PER_UNIT;
          const h = diff.before.dimensions.height * BASE_PIXELS_PER_UNIT;

          return (
            <Group key={`preview_del_${diff.id}`}>
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(239, 68, 68, 0.2)"
                stroke="#ef4444"
                strokeWidth={2 / zoom}
                dash={[4 / zoom, 2 / zoom]}
              />
              <Line
                points={[x, y, x + w, y + h]}
                stroke="#ef4444"
                strokeWidth={1.5 / zoom}
              />
              <Line
                points={[x, y + h, x + w, y]}
                stroke="#ef4444"
                strokeWidth={1.5 / zoom}
              />
              <Text
                x={x + 4 / zoom}
                y={y + 4 / zoom}
                text={`✕ ${diff.name || diff.type} (Delete)`}
                fontSize={10 / zoom}
                fill="#ef4444"
                fontStyle="bold"
                fontFamily="'Inter', sans-serif"
              />
            </Group>
          );
        }

        return null;
      })}
    </Group>
  );
};
