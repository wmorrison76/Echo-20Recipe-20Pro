import { useState } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import {
  ProjectDashboard,
  DiscoveryPanel,
  WorkbenchPanel,
  InsightsPanel,
  RDLabSessionSidebar,
} from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  // Force dashboard view - the old portal implementation is archived
  const [showDashboard, setShowDashboard] = useState(true);

  // Keep dashboard view locked for now - workbench interaction disabled
  const handleToggleDashboard = (show: boolean) => {
    // Only allow toggling to workbench if experiments exist
    if (!show && store && store.experiments.length === 0) {
      return; // Prevent switching to empty workbench
    }
    setShowDashboard(show);
  };

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Loading R&D Labs...</p>
          <p className="text-sm text-slate-400">Store initializing</p>
        </div>
      </div>
    );
  }

  const culinaryExperiments = store.experiments.filter(
    (e) => e.specialization === "culinary" || e.specialization === "both"
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20 bg-slate-900/50">
        <h1 className="text-2xl font-bold text-cyan-300">R&D Labs</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showDashboard ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToggleDashboard(!showDashboard)}
            className="gap-2"
            title="R&D Labs Dashboard"
          >
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-0">
        {/* Discovery Panel - Left */}
        <div className="w-72 border-r border-cyan-400/10 bg-slate-900/30 overflow-auto flex-shrink-0">
          <div className="p-4">
            <DiscoveryPanel />
          </div>
        </div>

        {/* Center content - Dashboard or Workbench */}
        <div className="flex-1 overflow-auto flex flex-col">
          {showDashboard ? (
            <ProjectDashboard
              onSelectProject={() => setShowDashboard(false)}
              onCreateProject={() => {}}
              recentProjects={[]}
              allProjects={[]}
            />
          ) : (
            <div className="p-4 flex-1 overflow-auto">
              <WorkbenchPanel />
            </div>
          )}
        </div>

        {/* Right Panel - Insights/Session Info */}
        {!showDashboard && (
          <div className="w-72 border-l border-cyan-400/10 bg-slate-900/30 overflow-auto flex-shrink-0">
            <div className="p-4">
              <RDLabSessionSidebar
                isDarkMode={true}
                projectName="R&D Labs"
                createdAt={new Date().toISOString()}
                updatedAt={new Date().toISOString()}
                experimentsCount={culinaryExperiments.length}
                discoveryQueue={culinaryExperiments.slice(0, 3)}
                backlog={[]}
                insights={[]}
              />
              <div className="mt-6">
                <InsightsPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
