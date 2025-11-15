import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BookOpen, Lightbulb, Loader2 } from "lucide-react";

export interface CrossTrackSuggestion {
  id: string;
  recipeId: string;
  title: string;
  track: "fine-dining";
  score: number;
  metadata?: {
    cuisine?: string;
    course?: string;
    tags?: string[];
  };
}

interface CrossTrackLearningProps {
  recipeText: string;
  organizationId: string;
  onSelectSuggestion?: (recipe: CrossTrackSuggestion) => void;
  limit?: number;
}

export function CrossTrackLearning({
  recipeText,
  organizationId,
  onSelectSuggestion,
  limit = 3,
}: CrossTrackLearningProps) {
  const [suggestions, setSuggestions] = useState<CrossTrackSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    if (!recipeText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pinecone/cross-track-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeText,
          organizationId,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load suggestions");
      }

      const data = await response.json();
      setSuggestions(data.data?.suggestions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load suggestions",
      );
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [recipeText, organizationId, limit]);

  // Auto-load suggestions when component mounts or recipe text changes
  const [lastRecipeText, setLastRecipeText] = useState(recipeText);
  if (recipeText !== lastRecipeText) {
    setLastRecipeText(recipeText);
    if (recipeText.trim()) {
      loadSuggestions();
    }
  }

  if (isLoading && suggestions.length === 0) {
    return (
      <Card className="p-4 border border-accent/20 dark:border-cyan-500/20 bg-input dark:bg-slate-900/40">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            Finding inspiration from fine dining...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 border-amber-500/20 bg-amber-50/5">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border border-cyan-500/30 dark:border-cyan-500/30 bg-cyan-50/5 dark:bg-cyan-500/5">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground dark:text-white">
              Learn from Fine Dining Excellence
            </h4>
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
              These techniques can improve precision and consistency in your
              manufacturing process
            </p>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className="p-2 border border-cyan-400/20 dark:border-cyan-500/20 bg-cyan-100/5 dark:bg-cyan-500/5 cursor-pointer hover:border-cyan-400/40 dark:hover:border-cyan-500/40 transition-colors"
              onClick={() => onSelectSuggestion?.(suggestion)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground dark:text-white truncate">
                    {suggestion.title}
                  </p>
                  {suggestion.metadata?.cuisine && (
                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                      {suggestion.metadata.cuisine}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {(suggestion.score * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    Relevant
                  </p>
                </div>
              </div>

              {/* Tags */}
              {suggestion.metadata?.tags &&
                suggestion.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.metadata.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
            </Card>
          ))}
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={loadSuggestions}
          disabled={isLoading}
          className="w-full gap-2"
        >
          <BookOpen className="h-4 w-4" />
          {isLoading ? "Refreshing..." : "Refresh Suggestions"}
        </Button>
      </div>
    </Card>
  );
}
