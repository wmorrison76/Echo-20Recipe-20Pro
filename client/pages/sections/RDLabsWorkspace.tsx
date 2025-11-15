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
  AIExperimentDesigner,
  AIValidationPanel,
  AISOPGenerator,
  AIProductionReadiness,
  AIRecommendations,
  AITeamInsights,
  AIPredictiveAnalytics,
  TrackSelector,
} from "@/components/RDLab";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Beaker, TestTube, Search, Settings, Home, HelpCircle, Sparkles, BarChart3, Zap, Wand2, CheckCircle, FileText, AlertTriangle, Lightbulb, Users, Target, Plus } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  const { user } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [labMode, setLabMode] = useState<"culinary" | "pastry">("culinary");
  const [recipeTrack, setRecipeTrack] = useState<"fine-dining" | "manufacturing">("fine-dining");

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center rdlabs-container relative">
        <div className="text-center space-y-4 relative z-20">
          <Beaker className="h-16 w-16 mx-auto neon-cyan opacity-75" />
          <p className="text-xl font-bold neon-cyan">R&D Labs</p>
          <p className="text-sm text-slate-400">Initializing research environment...</p>
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
    <div className="w-full h-full flex flex-col rdlabs-container text-slate-100 relative">
      {/* Professional Header */}
      <div className="flex items-center justify-between px-6 py-4 rdlabs-header relative z-10">
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
              labMode === "pastry" ? "neon-pink" : "neon-cyan"
            }`}>
              R&D Labs
            </h1>
            <p className="text-xs text-slate-400">
              {labMode === "pastry" ? "Pastry Research & Development" : "Culinary Research & Development"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="text-slate-200 neon-cyan font-medium">{experimentsCount} Active Experiments</p>
            <p className="text-slate-400 text-xs">Research in progress</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setLabMode(labMode === "pastry" ? "culinary" : "pastry")}
              className={`gap-2 rdlabs-button-primary ${
                labMode === "pastry"
                  ? "neon-pink"
                  : "neon-cyan"
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
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="gap-2 rdlabs-button-primary neon-cyan"
              title="R&D Labs Guide"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </Button>
            <Button
              size="sm"
              onClick={() => setShowDashboard(true)}
              className="gap-2 rdlabs-button-primary neon-cyan"
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
        <div className="w-80 rdlabs-sidebar overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 rdlabs-sidebar-section rdlabs-sidebar-header">
            <h2 className="text-sm font-semibold neon-cyan mb-1">Active Experiment</h2>
            <p className="text-xs text-slate-400">
              {focusExperiment?.title || "Select an experiment"}
            </p>
          </div>

          {/* Track Selector */}
          {user && (
            <div className="px-3 py-3 rdlabs-track-selector">
              <TrackSelector
                chefId={user.id}
                onTrackChange={(track) => setRecipeTrack(track)}
              />
            </div>
          )}

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
                  <h3 className="text-sm font-semibold neon-cyan mb-2">Quick Actions</h3>
                  <Button className="w-full rdlabs-button-primary neon-cyan" size="sm">
                    New Experiment
                  </Button>
                </div>
                <div className="rdlabs-divider my-2"></div>
                <div className="pt-2">
                  <h3 className="text-sm font-semibold neon-cyan mb-2">Selected ({selectedIds.size})</h3>
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
        <div className="flex-1 flex flex-col overflow-hidden rdlabs-content">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <TabsList className="w-full justify-start rounded-none rdlabs-tablist h-12 overflow-x-auto">
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
              <TabsTrigger value="ai-design" className="gap-2 ai-tab-trigger ai-tab-design neon-cyan">
                <Wand2 className="h-4 w-4" />
                AI Design
              </TabsTrigger>
              <TabsTrigger value="ai-validate" className="gap-2 ai-tab-trigger ai-tab-validate neon-purple">
                <CheckCircle className="h-4 w-4" />
                AI Validate
              </TabsTrigger>
              <TabsTrigger value="ai-sop" className="gap-2 ai-tab-trigger ai-tab-sop neon-cyan">
                <FileText className="h-4 w-4" />
                AI SOP
              </TabsTrigger>
              <TabsTrigger value="ai-production" className="gap-2 ai-tab-trigger ai-tab-production">
                <AlertTriangle className="h-4 w-4" />
                Production Check
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" className="gap-2 ai-tab-trigger ai-tab-insights neon-cyan">
                <Lightbulb className="h-4 w-4" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="ai-team" className="gap-2 ai-tab-trigger ai-tab-team neon-pink">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="ai-predict" className="gap-2 ai-tab-trigger ai-tab-predict neon-indigo">
                <Target className="h-4 w-4" />
                Predictions
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
              <TabsContent value="overview" className="m-0">
                <div className="p-6">
                  <DashboardOverviewPanel period="30d" />
                </div>
              </TabsContent>

              <TabsContent value="insights" className="m-0">
                <div className="p-6">
                  <DashboardQuickAccessPanel
                    period="30d"
                    onNewExperiment={() => setActiveTab("workbench")}
                    onViewAnalytics={() => setActiveTab("analytics")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="m-0">
                <div className="p-6">
                  <DashboardAnalyticsPanel period="30d" />
                </div>
              </TabsContent>

              <TabsContent value="ai-design" className="m-0">
                <div className="p-6">
                  <AIExperimentDesigner />
                </div>
              </TabsContent>

              <TabsContent value="ai-validate" className="m-0">
                <div className="p-6">
                  <AIValidationPanel />
                </div>
              </TabsContent>

              <TabsContent value="ai-sop" className="m-0">
                <div className="p-6">
                  <AISOPGenerator />
                </div>
              </TabsContent>

              <TabsContent value="ai-production" className="m-0">
                <div className="p-6">
                  <AIProductionReadiness />
                </div>
              </TabsContent>

              <TabsContent value="ai-recommendations" className="m-0">
                <div className="p-6">
                  <AIRecommendations />
                </div>
              </TabsContent>

              <TabsContent value="ai-team" className="m-0">
                <div className="p-6">
                  <AITeamInsights />
                </div>
              </TabsContent>

              <TabsContent value="ai-predict" className="m-0">
                <div className="p-6">
                  <AIPredictiveAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="workbench" className="m-0">
                <div className="p-6">
                  <WorkbenchPanel />
                </div>
              </TabsContent>

              <TabsContent value="discovery" className="m-0">
                <div className="p-6">
                  <DiscoveryPanel />
                </div>
              </TabsContent>

              <TabsContent value="search" className="m-0">
                <div className="p-6">
                  <GlobalExperimentSearch />
                </div>
              </TabsContent>

              <TabsContent value="tools" className="m-0">
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
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Session Info & Insights */}
        <div className="w-80 rdlabs-right-panel overflow-auto flex-shrink-0 flex flex-col">
          <div className="p-4 rdlabs-sidebar-section rdlabs-sidebar-header">
            <h2 className="text-sm font-semibold neon-cyan mb-1">Session Data</h2>
            <p className="text-xs text-slate-400">Active experiment metrics</p>
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
            <div className="rdlabs-divider my-4"></div>
            <div className="pt-4">
              <h3 className="text-sm font-semibold neon-cyan mb-3">Insights</h3>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
