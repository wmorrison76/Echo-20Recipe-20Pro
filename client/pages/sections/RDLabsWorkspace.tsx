import { useState, useCallback } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";
import { ProjectDashboard, RDLabsHelpPanel } from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();
  const [showDashboard, setShowDashboard] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

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

  // Show dashboard by default with help sidebar
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="flex items-center justify-between p-3 border-b border-cyan-500/10">
        <h1 className="text-lg font-semibold text-cyan-300">R&D Labs</h1>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <ProjectDashboard
            onSelectProject={handleSelectProject}
            onCreateProject={() => setShowDashboard(true)}
          />
        </div>
        <RDLabsHelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
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
