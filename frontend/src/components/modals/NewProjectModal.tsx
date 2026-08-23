import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useProject } from '../../hooks/useProject';
import { FACING_DEGREES, ALL_FACING_DIRECTIONS, FACING_LABELS } from '@vastuplan/shared';
import type { CreateProjectPayload, FacingDirection, PlotShape, Unit } from '@vastuplan/shared';
import { validateProject, getFieldError } from '../../utils/validation';

const SHAPE_OPTIONS: { value: PlotShape; label: string; description: string }[] = [
  { value: 'rectangle', label: 'Rectangle', description: 'Different width and length' },
  { value: 'square', label: 'Square', description: 'Equal width and length' },
];

export const NewProjectModal: React.FC = () => {
  const { closeNewProjectModal } = useUIStore();
  const { createProject } = useProject();

  const [name, setName] = useState('');
  const [shape, setShape] = useState<PlotShape>('rectangle');
  const [length, setLength] = useState('60');
  const [width, setWidth] = useState('40');
  const [unit, setUnit] = useState<Unit>('feet');
  const [facing, setFacing] = useState<FacingDirection>('east');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // When shape changes to square, sync width = length
  const handleShapeChange = (s: PlotShape) => {
    setShape(s);
    if (s === 'square') setWidth(length);
  };

  const handleLengthChange = (v: string) => {
    setLength(v);
    if (shape === 'square') setWidth(v);
  };

  const buildPayload = (): CreateProjectPayload => {
    const len = parseFloat(length);
    const wid = shape === 'square' ? len : parseFloat(width);
    return {
      name: name.trim(),
      plot: {
        shape,
        length: len,
        width: wid,
        unit,
        facing,
        orientationDegrees: FACING_DEGREES[facing],
      },
      floors: [
        {
          id: `floor_${Date.now()}`,
          name: 'Ground Floor',
          level: 0,
          entities: [],
          floorHeight: 10,
        },
      ],
      settings: {
        grid: { visible: true, cellSize: 1, snapToGrid: false },
        defaultUnit: unit,
        showDimensions: true,
        showCompass: true,
      },
    };
  };

  const payload = buildPayload();
  const validation = validateProject(payload);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched
    setTouched({ name: true, length: true, width: true, unit: true, facing: true });

    if (!validation.valid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createProject(payload);
      closeNewProjectModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (field: string) =>
    touched[field.split('.').pop()!] ? getFieldError(validation, field) : null;

  const area = (() => {
    const l = parseFloat(length);
    const w = shape === 'square' ? l : parseFloat(width);
    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) return null;
    return l * w;
  })();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeNewProjectModal()}>
      <div className="modal-panel max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <div>
            <h2 className="text-text-primary font-semibold text-base">New Project</h2>
            <p className="text-text-muted text-xs mt-0.5">Configure your plot to get started</p>
          </div>
          <button
            id="new-project-modal-close"
            className="btn btn-ghost btn-icon"
            onClick={closeNewProjectModal}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs text-text-secondary font-medium mb-1.5" htmlFor="new-project-name">
              Project Name <span className="text-error">*</span>
            </label>
            <input
              id="new-project-name"
              type="text"
              className={`input-base ${fieldError('name') ? 'border-error' : ''}`}
              placeholder="e.g. My Dream Home"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              autoFocus
            />
            {fieldError('name') && (
              <p className="text-error text-2xs mt-1">{fieldError('name')}</p>
            )}
          </div>

          {/* Plot Shape */}
          <div>
            <label className="block text-xs text-text-secondary font-medium mb-1.5">
              Plot Shape
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`new-project-shape-${opt.value}`}
                  className={`
                    p-3 rounded border text-left transition-all duration-150
                    ${shape === opt.value
                      ? 'border-brand-500 bg-brand-600/10 text-text-primary'
                      : 'border-panel-border bg-canvas-bg text-text-secondary hover:border-surface-overlay hover:bg-surface'}
                  `}
                  onClick={() => handleShapeChange(opt.value)}
                >
                  <div className="text-xs font-medium mb-0.5">{opt.label}</div>
                  <div className="text-2xs text-text-muted">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary font-medium mb-1.5" htmlFor="new-project-length">
                Length <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-project-length"
                  type="number"
                  step="any"
                  min="0.1"
                  className={`input-base pr-8 font-mono-numbers ${fieldError('plot.length') ? 'border-error' : ''}`}
                  value={length}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, length: true }))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-2xs">
                  {unit === 'feet' ? 'ft' : 'm'}
                </span>
              </div>
              {fieldError('plot.length') && (
                <p className="text-error text-2xs mt-1">{fieldError('plot.length')}</p>
              )}
            </div>

            {shape !== 'square' && (
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5" htmlFor="new-project-width">
                  Width <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-project-width"
                    type="number"
                    step="any"
                    min="0.1"
                    className={`input-base pr-8 font-mono-numbers ${fieldError('plot.width') ? 'border-error' : ''}`}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, width: true }))}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-2xs">
                    {unit === 'feet' ? 'ft' : 'm'}
                  </span>
                </div>
                {fieldError('plot.width') && (
                  <p className="text-error text-2xs mt-1">{fieldError('plot.width')}</p>
                )}
              </div>
            )}

            {shape === 'square' && (
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">
                  Width <span className="text-text-muted font-normal">(auto)</span>
                </label>
                <div className="input-base font-mono-numbers text-text-muted cursor-default bg-canvas-bg/50">
                  {length} {unit === 'feet' ? 'ft' : 'm'}
                </div>
              </div>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs text-text-secondary font-medium mb-1.5">
              Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['feet', 'meters'] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  id={`new-project-unit-${u}`}
                  className={`
                    py-2 px-3 rounded border text-xs font-medium transition-all duration-150
                    ${unit === u
                      ? 'border-brand-500 bg-brand-600/10 text-text-primary'
                      : 'border-panel-border bg-canvas-bg text-text-secondary hover:border-surface-overlay'}
                  `}
                  onClick={() => setUnit(u)}
                >
                  {u === 'feet' ? 'Feet (ft)' : 'Meters (m)'}
                </button>
              ))}
            </div>
          </div>

          {/* Facing */}
          <div>
            <label className="block text-xs text-text-secondary font-medium mb-1.5" htmlFor="new-project-facing">
              Plot Facing
            </label>
            <select
              id="new-project-facing"
              className="select-base"
              value={facing}
              onChange={(e) => setFacing(e.target.value as FacingDirection)}
            >
              {ALL_FACING_DIRECTIONS.map((dir) => (
                <option key={dir} value={dir}>{FACING_LABELS[dir]}</option>
              ))}
            </select>
          </div>

          {/* Area preview */}
          {area !== null && (
            <div className="bg-canvas-bg rounded border border-panel-border px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-2xs text-text-muted mb-0.5">Plot Area</div>
                <div className="text-text-primary text-sm font-medium font-mono-numbers">
                  {area.toFixed(0)} {unit === 'feet' ? 'sq.ft' : 'm²'}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xs text-text-muted mb-0.5">Facing</div>
                <div className="text-brand-400 text-sm font-medium">
                  {FACING_LABELS[facing]}
                </div>
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="bg-error/10 border border-error/30 rounded px-3 py-2">
              <p className="text-error text-xs">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              id="new-project-cancel-btn"
              className="btn btn-secondary btn-md flex-1"
              onClick={closeNewProjectModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="new-project-create-btn"
              className="btn btn-primary btn-md flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
