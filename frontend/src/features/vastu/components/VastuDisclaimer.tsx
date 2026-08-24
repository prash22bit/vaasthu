/**
 * VastuDisclaimer.tsx — Required traditional guidance disclaimer
 */
import React from 'react';
import { Info } from 'lucide-react';

export const VastuDisclaimer: React.FC = () => (
  <div className="flex items-start gap-1.5 bg-amber-950/30 border border-amber-800/30 rounded px-2 py-1.5 text-amber-300/70">
    <Info size={10} className="shrink-0 mt-0.5" />
    <p className="text-[9px] leading-tight">
      Traditional Vastu guidance only — not a scientific, structural, or regulatory requirement.
    </p>
  </div>
);
