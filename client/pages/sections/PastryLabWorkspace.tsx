import { useState, useCallback } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import { ProjectDashboard } from "@/components/RDLab";

function PastryLabWorkspaceContent() {
  const store = useOptionalRDLabStore();

  const handleSelectProject = useCallback(() => {
    // Handle project selection
  }, []);

  const handleBackToDashboard = useCallback(() => {
    // Handle back action
  }, []);

  // Debug: Show if store exists
  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Pastry Lab Loading...</p>
          <p className="text-sm text-slate-400">RDLabProvider may not be initialized</p>
        </div>
      </div>
    );
  }

  // Show dashboard with pastry filter
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="p-4 border-b border-rose-400/20">
        <h1 className="text-2xl font-bold text-rose-300">Pastry Lab</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <ProjectDashboard
          onSelectProject={handleSelectProject}
          onCreateProject={handleBackToDashboard}
        />
      </div>
    </div>
  );
}

export default function PastryLabWorkspace() {
  return (
    <RDLabProvider>
      <PastryLabWorkspaceContent />
    </RDLabProvider>
  );
}
