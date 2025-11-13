import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function RDLabsWorkspace() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-cyan-300">R&D Labs</h1>
          <p className="text-xl text-slate-400">Welcome to your research kitchen</p>
        </div>

        <p className="text-lg text-slate-300 max-w-md">
          Start by creating a new project to begin your culinary or pastry experimentation journey.
        </p>

        <Button
          className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Create New Project
        </Button>

        <div className="text-sm text-slate-500 pt-4">
          Preloaded projects will be available soon
        </div>
      </div>
    </div>
  );
}
