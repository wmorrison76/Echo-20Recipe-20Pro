import { RDLabProvider } from "@/stores/rdLabStore";
import { ProjectDashboard } from "@/components/RDLab";

export default function PastryLabWorkspace() {
  return (
    <RDLabProvider>
      <PastryLabWorkspaceContent />
    </RDLabProvider>
  );
}

function PastryLabWorkspaceContent() {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="p-4 border-b border-rose-400/20">
        <h1 className="text-2xl font-bold text-rose-300">Pastry Lab</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <ProjectDashboard
          onSelectProject={() => {}}
          onCreateProject={() => {}}
        />
      </div>
    </div>
  );
}
