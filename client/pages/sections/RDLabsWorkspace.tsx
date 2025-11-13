import { useState } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import {
  ProjectDashboard,
  DiscoveryPanel,
  WorkbenchPanel,
  InsightsPanel,
  RDLabSessionSidebar,
  GlobalExperimentSearch,
  ExperimentTemplates,
  CollaborationPanel,
  BatchOperations,
  RecipeLinkingPanel,
  ExportImport,
} from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Beaker, TestTube, Search, Settings, Home } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("workbench");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center space-y-4">
          <Beaker className="h-16 w-16 mx-auto text-cyan-400 opacity-50" />
          <p className="text-xl font-bold">R&D Labs</p>
          <p className="text-sm text-slate-400">Initializing research environment...</p>
        </div>
      </div>
    );
  }

  const experimentsCount = store.experiments.length;
  const focusExperiment = store.experiments.find(e => e.id === store.focusExperimentId);

  if (showDashboard) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <ProjectDashboard
          onSelectProject={() => setShowDashboard(false)}
          onCreateProject={() => {
            // Create new project workflow
            const newProjectId = store.createExperiment({
              title: "New Research Project",
              hypothesis: "Define your research hypothesis",
              owner: "Current User",
            });
            store.setFocusExperiment(newProjectId);
            setShowDashboard(false);
          }}
          recentProjects={[]}
          allProjects={[]}
        />
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDashboard(true)}
              className="gap-2"
              title="Back to Dashboard"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Context */}
        <div className="w-80 border-r border-cyan-500/10 bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-cyan-500/10 bg-slate-950/40">
            <h2 className="text-sm font-semibold text-cyan-300 mb-1">Active Experiment</h2>
            <p className="text-xs text-slate-400">
              {focusExperiment?.title || "Select an experiment"}
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === "workbench" || activeTab === "discovery" ? (
              <div className="p-4">
                <DiscoveryPanel />
              </div>
            ) : activeTab === "search" ? (
              <div className="p-4">
                <GlobalExperimentSearch />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-300 mb-2">Quick Actions</h3>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700" size="sm">
                    New Experiment
                  </Button>
                </div>
                <div className="border-t border-cyan-500/10 pt-4">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-2">Selected ({selectedIds.size})</h3>
                  {selectedIds.size > 0 ? (
                    <BatchOperations />
                  ) : (
                    <p className="text-xs text-slate-500">No experiments selected</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-cyan-500/10 bg-slate-900/50 px-6 h-12">
              <TabsTrigger value="workbench" className="gap-2">
                <TestTube className="h-4 w-4" />
                Workbench
              </TabsTrigger>
              <TabsTrigger value="discovery" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Discovery
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Settings className="h-4 w-4" />
                Tools
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="workbench" className="h-full m-0">
                <div className="h-full overflow-auto">
                  <div className="p-6">
                    <WorkbenchPanel />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discovery" className="h-full m-0">
                <div className="h-full overflow-auto">
                  <div className="p-6">
                    <DiscoveryPanel />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="search" className="h-full m-0">
                <div className="h-full overflow-auto">
                  <div className="p-6">
                    <GlobalExperimentSearch />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="h-full m-0">
                <div className="h-full overflow-auto">
                  <div className="grid grid-cols-2 gap-6 p-6">
                    <div className="col-span-1">
                      <h3 className="text-lg font-semibold text-cyan-300 mb-4">Templates</h3>
                      <ExperimentTemplates />
                    </div>
                    <div className="col-span-1 space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Collaboration</h3>
                        <CollaborationPanel />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Recipe Linking</h3>
                        <RecipeLinkingPanel />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold text-cyan-300 mb-4">Data Management</h3>
                      <ExportImport />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Session Info & Insights */}
        <div className="w-80 border-l border-cyan-500/10 bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-cyan-500/10 bg-slate-950/40">
            <h2 className="text-sm font-semibold text-cyan-300 mb-1">Session Data</h2>
            <p className="text-xs text-slate-400">Active experiment metrics</p>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {focusExperiment && (
              <RDLabSessionSidebar
                isDarkMode={true}
                projectName={focusExperiment.title}
                createdAt={new Date().toISOString()}
                updatedAt={new Date().toISOString()}
                experimentsCount={experimentsCount}
                discoveryQueue={store.experiments.slice(0, 3)}
                backlog={store.backlog}
                insights={store.insights}
              />
            )}
            <div className="border-t border-cyan-500/10 pt-4">
              <h3 className="text-sm font-semibold text-cyan-300 mb-3">Insights</h3>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
