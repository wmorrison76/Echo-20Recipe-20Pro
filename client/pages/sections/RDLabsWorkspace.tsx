import { useState } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import {
  ProjectDashboard,
  RDLabsHelpPanel,
  NewProjectDialog,
  DiscoveryPanel,
  WorkbenchPanel,
  InsightsPanel,
  RDLabSessionSidebar,
} from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { HelpCircle, LayoutGrid } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  const [showHelp, setShowHelp] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const handleCreateProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleNewProjectSubmit = (payload: {
    name: string;
    vision: string;
    textureFocus: string;
    flavorNotes: string;
    launchTarget: string;
  }) => {
    console.log("New project created:", payload);
    setShowNewProjectDialog(false);
    setShowDashboard(false);
  };

  // Show dashboard if toggled or no focus experiment
  const shouldShowDashboard = showDashboard || !store?.focusExperimentId;

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

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-cyan-500/10 bg-slate-900/50">
        <h1 className="text-lg font-semibold text-cyan-300">R&D Labs</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showDashboard ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowDashboard(!showDashboard)}
            className="gap-2"
            title="Toggle Dashboard View"
          >
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="gap-2"
            title="Open R&D Labs Help"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-0 relative">
        {/* Discovery Panel - Left */}
        <div className="w-72 border-r border-cyan-500/10 bg-slate-900/30 overflow-auto flex-shrink-0">
          <div className="p-4">
            <DiscoveryPanel />
          </div>
        </div>

        {/* Center content - Dashboard or Workbench */}
        <div className="flex-1 overflow-auto flex flex-col">
          {shouldShowDashboard ? (
            <ProjectDashboard
              onSelectProject={() => setShowDashboard(false)}
              onCreateProject={handleCreateProject}
            />
          ) : (
            <div className="p-4 flex-1 overflow-auto">
              <WorkbenchPanel />
            </div>
          )}
        </div>

        {/* Right Panel - Insights/Session Info or Help */}
        {!shouldShowDashboard && (
          <div className="w-72 border-l border-cyan-500/10 bg-slate-900/30 overflow-auto flex-shrink-0">
            {showHelp ? (
              <RDLabsHelpPanel isOpen={true} onClose={() => setShowHelp(false)} />
            ) : (
              <div className="p-4">
                <RDLabSessionSidebar
                  isDarkMode={true}
                  projectName="Active Project"
                  createdAt={new Date().toISOString()}
                  updatedAt={new Date().toISOString()}
                  experimentsCount={store.experiments.length}
                  discoveryQueue={store.experiments.slice(0, 3)}
                  backlog={[]}
                  insights={[]}
                />
                <div className="mt-6">
                  <InsightsPanel />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleNewProjectSubmit}
      />
    </div>
  );
}
