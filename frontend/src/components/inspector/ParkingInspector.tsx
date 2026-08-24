import React from 'react';
import type { ParkingEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';

interface ParkingInspectorProps {
  parking: ParkingEntity;
  unit: string;
}

export const ParkingInspector: React.FC<ParkingInspectorProps> = ({ parking, unit }) => {
  const { updateEntity } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const handleUpdate = (updates: Partial<ParkingEntity['properties']>) => {
    updateEntity(parking.id, {
      properties: { ...parking.properties, ...updates },
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Parking Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {parking.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Parking Type</label>
          <select
            className="input-base text-xs"
            value={parking.properties.parkingType || 'car'}
            onChange={(e) => handleUpdate({ parkingType: e.target.value as any })}
          >
            <option value="car">Car Parking</option>
            <option value="bike">Two-Wheeler / Bike</option>
            <option value="mixed">Mixed Parking</option>
          </select>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Vehicle Capacity</label>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((c) => (
              <button
                key={c}
                className={`btn btn-xs ${
                  parking.properties.vehicleCount === c ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => {
                  const bayW = c * 9;
                  updateEntity(parking.id, {
                    dimensions: { ...parking.dimensions, width: bayW },
                    properties: { ...parking.properties, vehicleCount: c },
                  });
                }}
              >
                {c} Bay{c > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="1"
              min="8"
              className="input-base font-mono-numbers"
              value={parking.dimensions.width}
              onChange={(e) => {
                const w = parseFloat(e.target.value) || 18;
                updateEntity(parking.id, {
                  dimensions: { ...parking.dimensions, width: w },
                });
              }}
            />
          </div>
          <div>
            <label className="inspector-label">Depth ({unitLabel})</label>
            <input
              type="number"
              step="1"
              min="10"
              className="input-base font-mono-numbers"
              value={parking.dimensions.height}
              onChange={(e) => {
                const h = parseFloat(e.target.value) || 18;
                updateEntity(parking.id, {
                  dimensions: { ...parking.dimensions, height: h },
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
