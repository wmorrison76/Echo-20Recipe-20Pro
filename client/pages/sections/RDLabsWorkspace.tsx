import { useState, useCallback } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import {
  ProjectDashboard,
  GlobalExperimentSearch,
  WorkbenchPanel,
  DiscoveryPanel,
  InsightsPanel,
  RDLabSessionSidebar,
  ExperimentTemplates,
  BatchOperations,
  RecipeLinkingPanel,
  CollaborationPanel,
  ExportImport,
} from "@/components/RDLab";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Layout, Search, Zap } from "lucide-react";

interface RDLabsWorkspaceProps {
  defaultProject?: string;
}

function RDLabsWorkspaceContent({ defaultProject }: RDLabsWorkspaceProps) {
  const store = useOptionalRDLabStore();
  const [showDashboard, setShowDashboard] = useState(true);

  const handleSelectProject = useCallback((_projectId: string) => {
    setShowDashboard(false);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setShowDashboard(true);
  }, []);

  if (!store) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 p-4 text-sm text-slate-600 dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/70">
        <p>R&D Labs loading...</p>
      </div>
    );
  }

  // Show dashboard on load
  if (showDashboard) {
    return (
      <div className="h-full w-full overflow-auto">
        <ProjectDashboard
          onSelectProject={handleSelectProject}
          onCreateProject={() => setShowDashboard(true)}
        />
      </div>
    );
  }

  // Show workbench after project selection
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="workbench" className="flex flex-1 flex-col gap-3">
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="workbench"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            <Zap className="h-4 w-4" />
            Workbench
          </TabsTrigger>
          <TabsTrigger
            value="discovery"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            <Layout className="h-4 w-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workbench" className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <WorkbenchPanel />
              </Card>
            </div>
            <div className="space-y-3">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <InsightsPanel />
              </Card>
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <BatchOperations />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discovery" className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <DiscoveryPanel />
              </Card>
            </div>
            <div className="space-y-3">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <RDLabSessionSidebar />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="flex-1 overflow-auto">
          <Card className="border-cyan-500/20 bg-slate-950/50">
            <GlobalExperimentSearch />
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="flex-1 overflow-auto">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0">
              <TabsTrigger
                value="templates"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="collaboration"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
              >
                Collaboration
              </TabsTrigger>
              <TabsTrigger
                value="recipe-linking"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
              >
                Recipe Linking
              </TabsTrigger>
              <TabsTrigger
                value="export-import"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
              >
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <ExperimentTemplates specialization="both" />
              </Card>
            </TabsContent>

            <TabsContent value="collaboration" className="mt-4">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                {store.focusExperimentId ? (
                  <CollaborationPanel experimentId={store.focusExperimentId} />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Select an experiment to manage collaborators
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="recipe-linking" className="mt-4">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                {store.focusExperimentId ? (
                  <RecipeLinkingPanel experimentId={store.focusExperimentId} />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Select an experiment to link recipes
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="export-import" className="mt-4">
              <Card className="border-cyan-500/20 bg-slate-950/50">
                <ExportImport />
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RDLabsWorkspace(props: RDLabsWorkspaceProps) {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent {...props} />
    </RDLabProvider>
  );
}
