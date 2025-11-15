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
  RDLabsHelpPanel,
  DashboardOverviewPanel,
  DashboardQuickAccessPanel,
  DashboardAnalyticsPanel,
} from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Beaker, TestTube, Search, Settings, Home, HelpCircle, Sparkles, BarChart3, Zap } from "lucide-react";

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
  const [showHelp, setShowHelp] = useState(false);
  const [labMode, setLabMode] = useState<"culinary" | "pastry">("culinary");

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground dark:text-white">
        <div className="text-center space-y-4">
          <Beaker className="h-16 w-16 mx-auto text-accent dark:text-cyan-400 opacity-50" />
          <p className="text-xl font-bold">R&D Labs</p>
          <p className="text-sm text-muted-foreground dark:text-slate-400">Initializing research environment...</p>
        </div>
      </div>
    );
  }

  const experimentsCount = store.experiments.length;
  const focusExperiment = store.experiments.find(e => e.id === store.focusExperimentId);

  if (showDashboard) {
    return (
      <div className="w-full h-full bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
    <div className="w-full h-full flex flex-col bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground dark:text-slate-100">
      {/* Professional Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-accent/20 dark:border-cyan-500/20 bg-input dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            labMode === "pastry"
              ? "bg-amber-100 dark:bg-rose-500/10 border-amber-300 dark:border-rose-500/20"
              : "bg-cyan-100 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/20"
          }`}>
            {labMode === "pastry" ? (
              <Sparkles className="h-5 w-5 text-amber-700 dark:text-rose-400" />
            ) : (
              <Beaker className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
            )}
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${
              labMode === "pastry" ? "text-amber-700 dark:text-rose-300" : "text-cyan-700 dark:text-cyan-300"
            }`}>
              R&D Labs
            </h1>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {labMode === "pastry" ? "Pastry Research & Development" : "Culinary Research & Development"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="text-foreground dark:text-slate-300 font-medium">{experimentsCount} Active Experiments</p>
            <p className="text-muted-foreground dark:text-slate-500 text-xs">Research in progress</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={labMode === "pastry" ? "default" : "outline"}
              size="sm"
              onClick={() => setLabMode(labMode === "pastry" ? "culinary" : "pastry")}
              className={`gap-2 ${
                labMode === "pastry"
                  ? "bg-amber-600 dark:bg-rose-600 hover:bg-amber-700 dark:hover:bg-rose-700 text-white"
                  : ""
              }`}
              title={labMode === "pastry" ? "Switch to Culinary Lab" : "Switch to Pastry Lab"}
            >
              {labMode === "pastry" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {labMode === "pastry" ? "Pastry Lab" : "Culinary Lab"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="gap-2"
              title="R&D Labs Guide"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </Button>
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Help Panel Overlay */}
        {showHelp && (
          <div className="absolute right-0 top-0 bottom-0 z-50">
            <RDLabsHelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
          </div>
        )}

        {/* Left Panel - Context */}
        <div className="w-80 border-r border-accent/20 dark:border-cyan-500/10 bg-input dark:bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-accent/20 dark:border-cyan-500/10 bg-muted dark:bg-slate-950/40">
            <h2 className="text-sm font-semibold text-accent dark:text-cyan-300 mb-1">Active Experiment</h2>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
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
                  <h3 className="text-sm font-semibold text-accent dark:text-cyan-300 mb-2">Quick Actions</h3>
                  <Button className="w-full bg-accent dark:bg-cyan-600 hover:bg-accent/90 dark:hover:bg-cyan-700" size="sm">
                    New Experiment
                  </Button>
                </div>
                <div className="border-t border-accent/20 dark:border-cyan-500/10 pt-4">
                  <h3 className="text-sm font-semibold text-accent dark:text-cyan-300 mb-2">Selected ({selectedIds.size})</h3>
                  {selectedIds.size > 0 ? (
                    <BatchOperations />
                  ) : (
                    <p className="text-xs text-muted-foreground dark:text-slate-500">No experiments selected</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card dark:bg-slate-950/40">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-accent/20 dark:border-cyan-500/10 bg-input dark:bg-slate-900/50 px-6 h-12 overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Zap className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
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
        <div className="w-80 border-l border-accent/20 dark:border-cyan-500/10 bg-input dark:bg-slate-900/20 overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-accent/20 dark:border-cyan-500/10 bg-muted dark:bg-slate-950/40">
            <h2 className="text-sm font-semibold text-accent dark:text-cyan-300 mb-1">Session Data</h2>
            <p className="text-xs text-muted-foreground dark:text-slate-400">Active experiment metrics</p>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {focusExperiment && (
              <RDLabSessionSidebar
                isDarkMode={document.documentElement.classList.contains('dark')}
                projectName={focusExperiment.title}
                createdAt={new Date().toISOString()}
                updatedAt={new Date().toISOString()}
                experimentsCount={experimentsCount}
                discoveryQueue={store.experiments.slice(0, 3)}
                backlog={store.backlog}
                insights={store.insights}
              />
            )}
            <div className="border-t border-accent/20 dark:border-cyan-500/10 pt-4">
              <h3 className="text-sm font-semibold text-accent dark:text-cyan-300 mb-3">Insights</h3>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
