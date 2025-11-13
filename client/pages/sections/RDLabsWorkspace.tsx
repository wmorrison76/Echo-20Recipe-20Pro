import { useState } from "react";
import { RDLabProvider } from "@/stores/rdLabStore";
import {
  ProjectDashboard,
  RDLabsHelpPanel,
  NewProjectDialog,
} from "@/components/RDLab";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <RDLabProvider>
      <RDLabsWorkspaceContent />
    </RDLabProvider>
  );
}

function RDLabsWorkspaceContent() {
  const [showHelp, setShowHelp] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

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
  };

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
            onSelectProject={() => {}}
            onCreateProject={handleCreateProject}
          />
        </div>
        <RDLabsHelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>

      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleNewProjectSubmit}
      />
    </div>
  );
}
