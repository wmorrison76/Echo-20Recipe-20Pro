import { useState } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import { ProjectDashboard } from "@/components/RDLab";
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
  const [showDashboard, setShowDashboard] = useState(true);

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
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20 bg-slate-900/50">
        <h1 className="text-2xl font-bold text-cyan-300">R&D Labs Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showDashboard ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            title="R&D Labs Dashboard"
          >
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto">
        <ProjectDashboard
          onSelectProject={() => {}}
          onCreateProject={() => {}}
          recentProjects={[]}
          allProjects={[]}
        />
      </div>
    </div>
  );
}
