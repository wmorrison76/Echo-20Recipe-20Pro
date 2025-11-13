import { useState, useCallback, useMemo } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import {
  GlobalExperimentSearch,
  WorkbenchPanel,
  DiscoveryPanel,
  InsightsPanel,
  ExperimentTemplates,
  BatchOperations,
  RecipeLinkingPanel,
  CollaborationPanel,
  ExportImport,
  ProjectDashboard,
} from "@/components/RDLab";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Sparkles, Search, Zap, Layout } from "lucide-react";

interface PastryLabWorkspaceProps {
  defaultProject?: string;
}

const PASTRY_FOCUS_AREAS = [
  {
    id: "lamination",
    name: "Lamination Excellence",
    description: "Perfecting laminated doughs and layering techniques",
  },
  {
    id: "fermented-dairy",
    name: "Fermented Dairy",
    description: "Developing cultured and fermented dairy components",
  },
  {
    id: "pastry-textures",
    name: "Pastry Textures",
    description: "Creating delicate and innovative pastry textures",
  },
  {
    id: "chocolate",
    name: "Chocolate Innovation",
    description: "Exploring chocolate work and applications",
  },
  {
    id: "sugar-techniques",
    name: "Sugar & Technique",
    description: "Advanced sugar work and pastry techniques",
  },
  {
    id: "gluten-free",
    name: "Gluten-Free Pastry",
    description: "Developing inclusive pastry options",
  },
];

function PastryLabWorkspaceContent({
  defaultProject,
}: PastryLabWorkspaceProps) {
  const store = useOptionalRDLabStore();
  const [selectedProject, setSelectedProject] = useState<string | null>(
    defaultProject || null,
  );
  const [currentView, setCurrentView] = useState<"dashboard" | "lab">(
    selectedProject ? "lab" : "dashboard",
  );

  const pastryExperiments = useMemo(
    () =>
      (store?.experiments || []).filter(
        (e) => e.specialization === "pastry" || e.specialization === "both",
      ),
    [store?.experiments],
  );

  const pastryStats = useMemo(
    () => ({
      total: pastryExperiments.length,
      ideation: pastryExperiments.filter((e) => e.status === "ideation").length,
      testing: pastryExperiments.filter((e) => e.status === "testing").length,
      ready: pastryExperiments.filter((e) => e.status === "ready").length,
    }),
    [pastryExperiments],
  );

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    setCurrentView("lab");
  }, []);

  const handleCreateProject = useCallback(() => {
    setCurrentView("dashboard");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedProject(null);
    setCurrentView("dashboard");
  }, []);

  if (!store) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 p-4 text-sm text-slate-600 dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/70">
        <p>Pastry Lab loading...</p>
      </div>
    );
  }

  if (currentView === "dashboard") {
    return (
      <div className="h-full overflow-auto">
        <ProjectDashboard
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-400" />
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Pastry R&D Lab
          </h2>
          <span className="ml-2 text-xs font-medium text-slate-400">
            {pastryStats.total} experiments
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card className="border-rose-400/20 bg-rose-950/20 p-3">
          <div className="text-2xl font-bold text-rose-300">
            {pastryStats.total}
          </div>
          <div className="text-xs font-medium text-rose-200">Total</div>
        </Card>
        <Card className="border-amber-400/20 bg-amber-950/20 p-3">
          <div className="text-2xl font-bold text-amber-300">
            {pastryStats.ideation}
          </div>
          <div className="text-xs font-medium text-amber-200">Ideation</div>
        </Card>
        <Card className="border-sky-400/20 bg-sky-950/20 p-3">
          <div className="text-2xl font-bold text-sky-300">
            {pastryStats.testing}
          </div>
          <div className="text-xs font-medium text-sky-200">Testing</div>
        </Card>
        <Card className="border-emerald-400/20 bg-emerald-950/20 p-3">
          <div className="text-2xl font-bold text-emerald-300">
            {pastryStats.ready}
          </div>
          <div className="text-xs font-medium text-emerald-200">Ready</div>
        </Card>
      </div>

      <Tabs defaultValue="workbench" className="flex flex-1 flex-col gap-3">
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="workbench"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-rose-400 data-[state=active]:bg-transparent"
          >
            <Zap className="h-4 w-4" />
            Workbench
          </TabsTrigger>
          <TabsTrigger
            value="discovery"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-rose-400 data-[state=active]:bg-transparent"
          >
            <Layout className="h-4 w-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-rose-400 data-[state=active]:bg-transparent"
          >
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger
            value="focus-areas"
            className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-rose-400 data-[state=active]:bg-transparent"
          >
            Focus Areas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workbench" className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-rose-500/20 bg-slate-950/50">
                <WorkbenchPanel />
              </Card>
            </div>
            <div className="space-y-3">
              <Card className="border-rose-500/20 bg-slate-950/50">
                <InsightsPanel />
              </Card>
              <Card className="border-rose-500/20 bg-slate-950/50">
                <BatchOperations />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discovery" className="flex-1 overflow-auto">
          <Card className="border-rose-500/20 bg-slate-950/50">
            <DiscoveryPanel />
          </Card>
        </TabsContent>

        <TabsContent value="search" className="flex-1 overflow-auto">
          <Card className="border-rose-500/20 bg-slate-950/50">
            <GlobalExperimentSearch />
          </Card>
        </TabsContent>

        <TabsContent value="focus-areas" className="flex-1 overflow-auto">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {PASTRY_FOCUS_AREAS.map((area) => (
                <Card
                  key={area.id}
                  className="border-rose-400/20 bg-rose-950/20 p-4 transition-all hover:border-rose-400/40 hover:bg-rose-950/30"
                >
                  <h3 className="font-semibold text-rose-200">{area.name}</h3>
                  <p className="mt-1 text-sm text-rose-300/70">
                    {area.description}
                  </p>
                </Card>
              ))}
            </div>

            <Card className="border-rose-500/20 bg-slate-950/50 p-4">
              <h3 className="mb-4 font-semibold text-white">
                Pastry-Specific Templates
              </h3>
              <ExperimentTemplates specialization="pastry" />
            </Card>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="border-rose-500/20 bg-slate-950/50">
                {store.focusExperimentId ? (
                  <CollaborationPanel experimentId={store.focusExperimentId} />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Select an experiment to manage collaborators
                  </div>
                )}
              </Card>

              <Card className="border-rose-500/20 bg-slate-950/50">
                {store.focusExperimentId ? (
                  <RecipeLinkingPanel experimentId={store.focusExperimentId} />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Select an experiment to link recipes
                  </div>
                )}
              </Card>
            </div>

            <Card className="border-rose-500/20 bg-slate-950/50">
              <ExportImport />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PastryLabWorkspace(props: PastryLabWorkspaceProps) {
  return (
    <RDLabProvider>
      <PastryLabWorkspaceContent {...props} />
    </RDLabProvider>
  );
}
