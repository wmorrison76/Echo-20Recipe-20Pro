import { useState, useCallback } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import { ProjectDashboard } from "@/components/RDLab";

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  const [showDashboard, setShowDashboard] = useState(true);

  const handleSelectProject = useCallback(() => {
    setShowDashboard(false);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setShowDashboard(true);
  }, []);

  // Debug: Show if store exists
  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Store Loading...</p>
          <p className="text-sm text-slate-400">RDLabProvider may not be initialized</p>
        </div>
      </div>
    );
  }

  // Show dashboard by default
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <ProjectDashboard
        onSelectProject={handleSelectProject}
        onCreateProject={() => setShowDashboard(true)}
      />
    </div>
  );
}

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}
