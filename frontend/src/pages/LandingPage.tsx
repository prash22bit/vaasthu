import React from 'react';
import { Plus, FolderOpen, Compass } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export const LandingPage: React.FC = () => {
  const { openNewProjectModal } = useUIStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-canvas-bg">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in">
        {/* Logo mark */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow">
            <Compass size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
          VastuPlan
        </h1>
        <p className="text-text-secondary text-base max-w-md">
          Intelligent house planning with Vastu analysis and AI-assisted design.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-72 animate-fade-in">
        <button
          id="landing-new-project-btn"
          className="btn btn-primary btn-lg gap-2 justify-center"
          onClick={openNewProjectModal}
        >
          <Plus size={18} />
          Create New Project
        </button>

        <div className="text-center text-text-muted text-xs py-1">or</div>

        <div className="bg-panel-bg border border-panel-border rounded-lg p-4 text-center">
          <FolderOpen size={20} className="text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm font-medium mb-1">Open Existing Project</p>
          <p className="text-text-muted text-xs">
            Use the <span className="text-brand-400">Projects</span> button in the top menu
          </p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex gap-2 flex-wrap justify-center mt-10 max-w-md animate-fade-in">
        {[
          'CAD-like Design',
          'Vastu Analysis',
          'AI-assisted Layout',
          'Multi-floor Support',
          '3D Visualization',
          'Blueprint Export',
        ].map((feature) => (
          <span
            key={feature}
            className="bg-surface border border-panel-border text-text-muted text-2xs px-2.5 py-1 rounded-full"
          >
            {feature}
          </span>
        ))}
      </div>

      <p className="text-text-muted text-2xs mt-8 opacity-50">Phase 1 — Foundation</p>
    </div>
  );
};
