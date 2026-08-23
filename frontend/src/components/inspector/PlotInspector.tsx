import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, RotateCw } from 'lucide-react';
import type { Plot, FacingDirection, Unit, PlotShape } from '@vastuplan/shared';
import { ALL_FACING_DIRECTIONS, FACING_LABELS } from '@vastuplan/shared';
import { useProject } from '../../hooks/useProject';
import { calculateArea, formatArea, getUnitLabel } from '../../utils/units';
import { validateDimension } from '../../utils/validation';
import { useCanvasStore } from '../../stores/canvasStore';

const SHAPE_OPTIONS: { value: PlotShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="inspector-section">
      <div className="inspector-section-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="inspector-field">
    <label className="inspector-label">{label}</label>
    {children}
  </div>
);

// ── Numeric dimension input ──────────────────────────────────────────────────

interface DimensionInputProps {
  value: number;
  unit: Unit;
  onCommit: (value: number) => void;
  id?: string;
}

const DimensionInput: React.FC<DimensionInputProps> = ({ value, unit, onCommit, id }) => {
  const suffix = unit === 'feet' ? 'ft' : 'm';
  const [localValue, setLocalValue] = useState(value.toFixed(2));
  const [error, setError] = useState<string | null>(null);

  // Sync local value when external value changes (e.g., undo/redo)
  useEffect(() => {
    setLocalValue(value.toFixed(2));
    setError(null);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const err = validateDimension(e.target.value);
    setError(err);
  };

  const handleCommit = () => {
    const err = validateDimension(localValue);
    if (err) {
      setError(err);
      setLocalValue(value.toFixed(2)); // revert
      return;
    }
    const num = parseFloat(localValue);
    onCommit(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommit();
    if (e.key === 'Escape') {
      setLocalValue(value.toFixed(2));
      setError(null);
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type="number"
          step="any"
          min="0.1"
          className={`input-base pr-7 font-mono-numbers ${error ? 'border-error focus:border-error focus:ring-error' : ''}`}
          value={localValue}
          onChange={handleChange}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-2xs pointer-events-none">
          {suffix}
        </span>
      </div>
      {error && <p className="text-error text-2xs mt-1">{error}</p>}
    </div>
  );
};

// ── Main PlotInspector ────────────────────────────────────────────────────────

export const PlotInspector: React.FC = () => {
  const { currentProject, updateFacing, updateDimensions, updateUnit, updateShape } = useProject();
  const fitToPlot = useCanvasStore((s) => s.fitToPlot);

  if (!currentProject) return null;

  const { plot } = currentProject;
  const area = calculateArea(plot.width, plot.length);

  const handleWidthCommit = (newWidth: number) => {
    const newLength = plot.shape === 'square' ? newWidth : plot.length;
    updateDimensions(newWidth, newLength);
  };

  const handleLengthCommit = (newLength: number) => {
    const newWidth = plot.shape === 'square' ? newLength : plot.width;
    updateDimensions(newWidth, newLength);
  };

  const handleFitToPlot = () => {
    fitToPlot(plot.width, plot.length);
  };

  return (
    <div className="animate-slide-in-right">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-panel-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold tracking-widest uppercase text-text-muted mb-0.5">
              Plot Properties
            </p>
            <p className="text-text-primary text-sm font-medium">{currentProject.name}</p>
          </div>
          <button
            id="plot-inspector-fit-btn"
            className="btn btn-ghost btn-icon"
            onClick={handleFitToPlot}
            title="Fit plot to canvas"
          >
            <RotateCw size={13} />
          </button>
        </div>
      </div>

      {/* Dimensions section */}
      <Section title="Dimensions">
        <Field label="Shape">
          <select
            id="plot-inspector-shape"
            className="select-base"
            value={plot.shape}
            onChange={(e) => updateShape(e.target.value as PlotShape)}
          >
            {SHAPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Width">
          <DimensionInput
            id="plot-inspector-width"
            value={plot.width}
            unit={plot.unit}
            onCommit={handleWidthCommit}
          />
        </Field>

        <Field label="Length">
          <DimensionInput
            id="plot-inspector-length"
            value={plot.length}
            unit={plot.unit}
            onCommit={handleLengthCommit}
          />
        </Field>

        <Field label="Unit">
          <select
            id="plot-inspector-unit"
            className="select-base"
            value={plot.unit}
            onChange={(e) => updateUnit(e.target.value as Unit)}
          >
            <option value="feet">Feet (ft)</option>
            <option value="meters">Meters (m)</option>
          </select>
        </Field>
      </Section>

      {/* Orientation section */}
      <Section title="Orientation">
        <Field label="Facing">
          <select
            id="plot-inspector-facing"
            className="select-base"
            value={plot.facing}
            onChange={(e) => updateFacing(e.target.value as FacingDirection)}
          >
            {ALL_FACING_DIRECTIONS.map((dir) => (
              <option key={dir} value={dir}>{FACING_LABELS[dir]}</option>
            ))}
          </select>
        </Field>
        <Field label="Azimuth">
          <div className="input-base font-mono-numbers text-text-muted cursor-default bg-canvas-bg/50">
            {plot.orientationDegrees}°
          </div>
        </Field>
      </Section>

      {/* Area section */}
      <Section title="Calculated">
        <div className="inspector-field">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-canvas-bg rounded p-2 border border-panel-border">
              <div className="text-2xs text-text-muted mb-0.5">Area</div>
              <div className="text-text-primary text-xs font-medium font-mono-numbers">
                {area.toFixed(0)}
              </div>
              <div className="text-text-muted text-2xs">
                {plot.unit === 'feet' ? 'sq.ft' : 'm²'}
              </div>
            </div>
            <div className="bg-canvas-bg rounded p-2 border border-panel-border">
              <div className="text-2xs text-text-muted mb-0.5">Perimeter</div>
              <div className="text-text-primary text-xs font-medium font-mono-numbers">
                {(2 * (plot.width + plot.length)).toFixed(1)}
              </div>
              <div className="text-text-muted text-2xs">
                {plot.unit === 'feet' ? 'ft' : 'm'}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
