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
import { LayoutGrid, Beaker } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  const [showDashboard, setShowDashboard] = useState(true);

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Beaker className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
          <p className="text-xl font-bold mb-2">R&D Labs</p>
          <p className="text-sm text-slate-400">Initializing research environment...</p>
        </div>
      </div>
    );
  }

  const experimentsCount = store.experiments.length;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Professional Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Beaker className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">R&D Labs</h1>
            <p className="text-xs text-slate-400">Culinary & Pastry Research Environment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="text-slate-300 font-medium">{experimentsCount} Active Experiments</p>
            <p className="text-slate-500 text-xs">Research in progress</p>
          </div>
          <Button
            variant={showDashboard ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowDashboard(!showDashboard)}
            className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            title="Toggle Dashboard View"
          >
            <LayoutGrid className="h-4 w-4" />
            {showDashboard ? "Dashboard" : "Workbench"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden gap-0">
        {/* Left Panel - Discovery */}
        <div className="w-80 border-r border-cyan-500/10 bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-cyan-500/10">
            <h2 className="text-sm font-semibold text-cyan-300 mb-2">Discovery Queue</h2>
            <p className="text-xs text-slate-400">Active research notes and insights</p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <DiscoveryPanel />
          </div>
        </div>

        {/* Center Panel - Dashboard or Workbench */}
        <div className="flex-1 overflow-auto flex flex-col bg-slate-950/40">
          {showDashboard ? (
            <div className="flex-1 overflow-auto">
              <ProjectDashboard
                onSelectProject={() => setShowDashboard(false)}
                onCreateProject={() => {}}
                recentProjects={[]}
                allProjects={[]}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <WorkbenchPanel />
            </div>
          )}
        </div>

        {/* Right Panel - Insights & Session Info */}
        {!showDashboard && (
          <div className="w-80 border-l border-cyan-500/10 bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-cyan-500/10">
              <h2 className="text-sm font-semibold text-cyan-300 mb-2">Session Data</h2>
              <p className="text-xs text-slate-400">Active experiment metrics</p>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-6">
              <RDLabSessionSidebar
                isDarkMode={true}
                projectName="Current Research"
                createdAt={new Date().toISOString()}
                updatedAt={new Date().toISOString()}
                experimentsCount={experimentsCount}
                discoveryQueue={store.experiments.slice(0, 3)}
                backlog={[]}
                insights={[]}
              />
              <div className="border-t border-cyan-500/10 pt-4">
                <InsightsPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
