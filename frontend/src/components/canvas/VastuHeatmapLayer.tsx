/**
 * VastuHeatmapLayer.tsx — Konva Layer: Vastu Zone Overlay
 *
 * Renders when isVastuActive === true.
 * Shows: 9 semi-transparent zone rectangles + direction labels + entity highlights.
 *
 * All zone geometry comes from buildVastuZoneMap() — the same source
 * used by the analysis engine. Heatmap and analysis CANNOT diverge.
 */

import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { VastuAnalysis, VastuDirection, VastuSettings } from '@vastuplan/shared';
import { VASTU_DIRECTION_LABELS } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { zoneHeatmapColor } from '../../features/vastu/vastuUtils';

interface VastuHeatmapLayerProps {
  vastuAnalysis: VastuAnalysis | null;
  zoom: number;
  settings: VastuSettings;
}

/** Status → border color for entity highlights */
const STATUS_HIGHLIGHT_COLOR: Record<string, string> = {
  preferred:  '#34d399', // emerald
  pass:       '#6ee7b7',
  acceptable: '#60a5fa', // blue
  warning:    '#fbbf24', // amber
  violation:  '#f87171', // red
  'not-applicable': 'transparent',
};

export const VastuHeatmapLayer: React.FC<VastuHeatmapLayerProps> = ({
  vastuAnalysis,
  zoom,
  settings,
}) => {
  if (!vastuAnalysis) return null;

  const { zoneMap, ruleResults } = vastuAnalysis;
  const px = BASE_PIXELS_PER_UNIT;

  // Build a map: entityId → worst status color (for entity highlights)
  const entityHighlights = new Map<string, string>();
  if (settings.showEntityHighlights) {
    // Group by entity, pick the worst status
    const entityWorstStatus = new Map<string, string>();
    const statusPriority = ['violation', 'warning', 'acceptable', 'pass', 'preferred', 'not-applicable'];

    for (const result of ruleResults) {
      if (!result.entityId) continue;
      const existing = entityWorstStatus.get(result.entityId);
      if (!existing || statusPriority.indexOf(result.status) < statusPriority.indexOf(existing)) {
        entityWorstStatus.set(result.entityId, result.status);
      }
    }

    for (const [id, status] of entityWorstStatus.entries()) {
      const color = STATUS_HIGHLIGHT_COLOR[status];
      if (color && color !== 'transparent') {
        entityHighlights.set(id, color);
      }
    }
  }

  const directions = Object.keys(zoneMap) as VastuDirection[];

  return (
    <Group listening={false}>
      {/* Zone rectangles + labels */}
      {settings.showHeatmap && directions.map((dir) => {
        const zone = zoneMap[dir];
        if (!zone) return null;

        const { x, y, width, height } = zone.worldBounds;
        const px_x = x * px;
        const px_y = y * px;
        const px_w = width * px;
        const px_h = height * px;

        const fillColor = zoneHeatmapColor(dir);
        const shortLabel = dir === 'CENTER' ? 'CENTER' : dir;
        const fullLabel = VASTU_DIRECTION_LABELS[dir];

        return (
          <Group key={dir}>
            {/* Zone fill */}
            <Rect
              x={px_x}
              y={px_y}
              width={px_w}
              height={px_h}
              fill={fillColor}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1 / zoom}
              listening={false}
            />

            {/* Direction label — short */}
            <Text
              x={px_x + px_w / 2}
              y={px_y + px_h / 2 - 12 / zoom}
              text={shortLabel}
              fontSize={14 / zoom}
              fontFamily="'JetBrains Mono', monospace"
              fontStyle="bold"
              fill="rgba(255,255,255,0.55)"
              align="center"
              offsetX={(shortLabel.length * 4.5) / zoom}
              listening={false}
            />

            {/* Direction label — full name (smaller) */}
            {px_w * zoom > 60 && (
              <Text
                x={px_x + px_w / 2}
                y={px_y + px_h / 2 + 2 / zoom}
                text={fullLabel}
                fontSize={8 / zoom}
                fontFamily="Inter, sans-serif"
                fill="rgba(255,255,255,0.30)"
                align="center"
                offsetX={(fullLabel.length * 2.5) / zoom}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
};
