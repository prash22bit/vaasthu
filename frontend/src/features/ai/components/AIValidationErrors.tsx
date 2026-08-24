import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { AIValidationError } from '@vastuplan/shared';

interface AIValidationErrorsProps {
  errors: AIValidationError[];
  warnings?: string[];
}

export const AIValidationErrors: React.FC<AIValidationErrorsProps> = ({ errors, warnings = [] }) => {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {errors.map((err, i) => (
        <div
          key={`err_${i}`}
          className="flex items-start gap-1.5 text-2xs text-error bg-error/10 border border-error/20 p-2 rounded"
        >
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{err.reason}</span>
        </div>
      ))}

      {warnings.map((warn, i) => (
        <div
          key={`warn_${i}`}
          className="flex items-start gap-1.5 text-2xs text-warning bg-warning/10 border border-warning/20 p-2 rounded"
        >
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{warn}</span>
        </div>
      ))}
    </div>
  );
};
