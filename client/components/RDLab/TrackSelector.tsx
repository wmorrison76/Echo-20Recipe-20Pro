import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChefHat,
  Factory,
  Users,
  Sparkles,
  Settings,
} from "lucide-react";
import {
  type RecipeTrack,
  useRecipeTrack,
  getTrackDisplayName,
  getTrackDescription,
} from "@/hooks/use-recipe-track";

interface TrackSelectorProps {
  chefId: string;
  onTrackChange?: (track: RecipeTrack) => void;
}

export function TrackSelector({ chefId, onTrackChange }: TrackSelectorProps) {
  const {
    track,
    showAdvanced,
    collaborators,
    isLoading,
    switchTrack,
    toggleAdvanced,
    addCollaborator,
    removeCollaborator,
  } = useRecipeTrack(chefId);
  
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState("");

  const handleTrackChange = (newTrack: string) => {
    const selectedTrack = newTrack as RecipeTrack;
    switchTrack(selectedTrack);
    onTrackChange?.(selectedTrack);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Track Selector */}
      <Card className="p-4 border border-accent/20 dark:border-cyan-500/20 bg-input dark:bg-slate-900/40">
        <div className="space-y-4">
          {/* Track Selection */}
          <div>
            <label className="text-sm font-semibold text-foreground dark:text-white mb-2 block">
              R&D Track
            </label>
            <Select value={track} onValueChange={handleTrackChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fine-dining">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-cyan-500" />
                    Fine Dining Innovation
                  </div>
                </SelectItem>
                {showAdvanced && (
                  <SelectItem value="manufacturing">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-amber-500" />
                      Manufacturing Excellence
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Track Description */}
          <div className="p-3 rounded-lg bg-accent/5 dark:bg-cyan-500/5 border border-accent/10 dark:border-cyan-500/10">
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              {getTrackDescription(track)}
            </p>
          </div>

          {/* Track Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`${
                track === "fine-dining"
                  ? "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30"
                  : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30"
              }`}
            >
              {track === "fine-dining" ? (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </>
              ) : (
                <>
                  <Factory className="h-3 w-3 mr-1" />
                  Industrial
                </>
              )}
            </Badge>

            {/* Advanced Options Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdvanced}
              className="gap-2"
            >
              <AdvancedSettings className="h-4 w-4" />
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </div>
        </div>
      </Card>

      {/* Collaboration Section */}
      {showAdvanced && (
        <Card className="p-4 border border-accent/20 dark:border-cyan-500/20 bg-input dark:bg-slate-900/40">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                Collaborating Chefs
              </h3>
            </div>

            {/* Collaborators List */}
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collaboratorId) => (
                  <Badge
                    key={collaboratorId}
                    variant="secondary"
                    className="cursor-pointer hover:opacity-75"
                    onClick={() => removeCollaborator(collaboratorId)}
                  >
                    {collaboratorId}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Collaborator */}
            {showCollaborators && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Chef ID or email"
                  value={newCollaborator}
                  onChange={(e) => setNewCollaborator(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-accent/20 dark:border-cyan-500/20 bg-background dark:bg-slate-950"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCollaborator.trim()) {
                      addCollaborator(newCollaborator.trim());
                      setNewCollaborator("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (newCollaborator.trim()) {
                      addCollaborator(newCollaborator.trim());
                      setNewCollaborator("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCollaborators(!showCollaborators)}
              className="w-full"
            >
              {showCollaborators ? "Done" : "Add Collaborator"}
            </Button>
          </div>
        </Card>
      )}

      {/* Cross-Track Learning Indicator (for Manufacturing) */}
      {track === "manufacturing" && showAdvanced && (
        <Card className="p-4 border border-amber-500/30 dark:border-amber-500/30 bg-amber-50/5 dark:bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground dark:text-white mb-1">
                Learning from Fine Dining
              </h4>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Access precision techniques and consistency methods from fine
                dining innovations to improve manufacturing efficiency and
                quality.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
