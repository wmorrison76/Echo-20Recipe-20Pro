import { useState, useEffect } from "react";
import { useLabSession } from "@/hooks/use-lab-session";
import { EchoChatInterface } from "./EchoChatInterface";
import { SlidingDoorPanels } from "./SlidingDoorPanels";
import { EnhancedLabWhiteboard, FontStyle } from "./EnhancedLabWhiteboard";
import { LabSettingsPopup } from "./LabSettingsPopup";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface IntegratedLabEntranceProps {
  onLabEnter?: (projectInfo: {
    projectName: string;
    projectId: string;
  }) => void;
  blackboardImageUrl?: string;
}

export function IntegratedLabEntrance({
  onLabEnter,
  blackboardImageUrl,
}: IntegratedLabEntranceProps) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [fontStyle, setFontStyle] = useState<FontStyle>("chalkboard");

  // Load or create session
  const {
    sessionData,
    isLoading,
    updateProject,
    updateEntries,
    setFontStyle: saveFontStyle,
    setDoorsOpen: saveDoorsOpen,
  } = useLabSession(currentProjectId || "default");

  // Handle lab trigger from chat
  const handleLabTrigger = (projectInfo: {
    projectName: string;
    projectId: string;
    conversationContext: string;
  }) => {
    try {
      setCurrentProjectId(projectInfo.projectId);
      updateProject(
        projectInfo.projectName,
        "culinary",
        "fine-dining"
      );
      setDoorsOpen(true);
      saveDoorsOpen(true);
      onLabEnter?.(projectInfo);

      toast.success(`${projectInfo.projectName} lab activated!`);
    } catch (err) {
      console.error("Failed to activate lab:", err);
      toast.error("Failed to activate lab. Please try again.");
    }
  };

  const handleFontChange = (newStyle: FontStyle) => {
    setFontStyle(newStyle);
    saveFontStyle(newStyle);
  };

  const handleCloseLab = () => {
    setDoorsOpen(false);
    saveDoorsOpen(false);
  };

  if (!currentProjectId) {
    // Initial chat interface
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        <EchoChatInterface onLabTrigger={handleLabTrigger} />
      </div>
    );
  }

  // Active lab with doors and whiteboard
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      {/* Chat interface always visible on sides */}
      <div className="absolute bottom-4 left-4 z-30 max-w-xs max-h-96 rounded-lg shadow-2xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md overflow-hidden">
        <div className="p-4 flex flex-col h-96">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">ECHO Chat</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCloseLab}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <EchoChatInterface onLabTrigger={handleLabTrigger} />
        </div>
      </div>

      {/* Sliding door panels with whiteboard */}
      <SlidingDoorPanels
        isOpen={doorsOpen}
        onToggle={setDoorsOpen}
        labMode="culinary"
      >
        <div className="w-full h-full flex items-center justify-center p-8">
          {isLoading ? (
            <div className="text-slate-400">Loading lab...</div>
          ) : (
            <div className="w-full h-full flex flex-col gap-4">
              {/* Top controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <div>
                  <h2 className="text-xl font-bold text-amber-100">
                    {sessionData?.projectName || "Lab Whiteboard"}
                  </h2>
                  <p className="text-xs text-amber-100/60">
                    Lab Session • {sessionData?.entries?.length || 0} entries
                  </p>
                </div>
                <LabSettingsPopup
                  fontStyle={fontStyle}
                  onFontStyleChange={handleFontChange}
                  onClose={() => {}}
                />
              </div>

              {/* Whiteboard */}
              <EnhancedLabWhiteboard
                isVisible={true}
                projectName={sessionData?.projectName || "Unnamed Project"}
                projectId={currentProjectId}
                onClose={handleCloseLab}
                entries={sessionData?.entries || []}
                onEntriesChange={updateEntries}
                fontStyle={fontStyle}
                onFontStyleChange={handleFontChange}
                blackboardImage={blackboardImageUrl}
              />
            </div>
          )}
        </div>
      </SlidingDoorPanels>

      {/* Quick access toolbar - visible when doors closed */}
      {!doorsOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-900/80 border border-slate-700/50 rounded-lg p-4 backdrop-blur-md">
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-300">Lab minimized</p>
            <p className="text-xs text-slate-500">
              Click the 20px peek on the sides or the button below to open
            </p>
            <Button
              size="sm"
              onClick={() => setDoorsOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Open Lab
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
