import React from 'react';
import type { FacingDirection } from '@vastuplan/shared';
import { FACING_DEGREES } from '@vastuplan/shared';

interface CompassWidgetProps {
  facing: FacingDirection;
  size?: number;
}

/**
 * SVG compass widget showing cardinal and intercardinal directions.
 * The "entrance arrow" rotates based on the plot's facing direction.
 * Rendered as an HTML overlay on top of the Konva canvas.
 */
export const CompassWidget: React.FC<CompassWidgetProps> = ({ facing, size = 80 }) => {
  const facingDeg = FACING_DEGREES[facing];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  // Direction labels with positions
  const labels = [
    { label: 'N', angle: 0, color: '#ef4444' },
    { label: 'NE', angle: 45, small: true },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135, small: true },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225, small: true },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315, small: true },
  ];

  // Calculate label positions
  const labelPos = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * radius,
      y: cy + Math.sin(rad) * radius,
    };
  };

  // Facing direction indicator
  const isFacingDir = (angle: number) => angle === facingDeg;

  return (
    <div
      id="compass-widget"
      className="absolute bottom-4 right-4 pointer-events-none select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="rgba(20, 24, 32, 0.85)"
          stroke="rgba(59, 66, 104, 0.7)"
          strokeWidth={1}
        />

        {/* Tick marks */}
        {Array.from({ length: 36 }, (_, i) => {
          const angle = i * 10;
          const isCardinal = angle % 90 === 0;
          const isIntercardinal = angle % 45 === 0;
          const rad = ((angle - 90) * Math.PI) / 180;
          const innerR = isCardinal ? r - 8 : isIntercardinal ? r - 6 : r - 4;
          return (
            <line
              key={angle}
              x1={cx + Math.cos(rad) * innerR}
              y1={cy + Math.sin(rad) * innerR}
              x2={cx + Math.cos(rad) * (r - 1)}
              y2={cy + Math.sin(rad) * (r - 1)}
              stroke={isCardinal ? '#3a4268' : '#2a3050'}
              strokeWidth={isCardinal ? 1.5 : 0.8}
            />
          );
        })}

        {/* Facing direction arc highlight */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 3}
          fill="none"
          stroke="#4d64ff"
          strokeWidth={2}
          strokeDasharray={`${2 * Math.PI * (r - 3) * (45 / 360)} ${2 * Math.PI * (r - 3) * (315 / 360)}`}
          strokeDashoffset={
            2 * Math.PI * (r - 3) * ((90 - facingDeg + 22.5) / 360)
          }
          opacity={0.5}
        />

        {/* Direction labels */}
        {labels.map(({ label, angle, small, color }) => {
          const isActive = isFacingDir(angle);
          const pos = labelPos(angle, r - (small ? 14 : 13));
          const fontSize = small ? 6 : 8;
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontFamily="Inter, sans-serif"
              fontWeight={isActive ? 700 : small ? 400 : 500}
              fill={
                isActive
                  ? '#4d64ff'
                  : label === 'N'
                  ? '#ef4444'
                  : small
                  ? '#3a4268'
                  : '#8b93b0'
              }
            >
              {label}
            </text>
          );
        })}

        {/* Center cross */}
        <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#2a3050" strokeWidth={1} />
        <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="#2a3050" strokeWidth={1} />

        {/* Facing arrow */}
        <g transform={`rotate(${facingDeg}, ${cx}, ${cy})`}>
          {/* Arrow shaft */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r + 16}
            stroke="#4d64ff"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Arrow head */}
          <polygon
            points={`${cx},${cy - r + 16} ${cx - 3},${cy - r + 22} ${cx + 3},${cy - r + 22}`}
            fill="#4d64ff"
          />
          {/* Counter arrow (south half) */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy + r - 18}
            stroke="#3a4268"
            strokeWidth={1}
            strokeLinecap="round"
          />
        </g>

        {/* Entrance label */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={5.5}
          fontFamily="Inter, sans-serif"
          fill="#4d64ff"
          opacity={0.8}
        >
          {facing.toUpperCase().replace(/-/g, '')}
        </text>
      </svg>
    </div>
  );
};
