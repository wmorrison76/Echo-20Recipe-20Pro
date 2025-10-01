import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Recipe } from "@/context/AppDataContext";

type SortMode = "recent" | "alpha" | "tagged";

type RecipeSelectionPanelProps = {
  recipes: Recipe[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onBulkAdd: (ids: string[]) => void;
  onBulkRemove: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
};

export function RecipeSelectionPanel({
  recipes,
  selectedIds,
  onToggle,
  onBulkAdd,
  onBulkRemove,
  searchTerm,
  onSearchTermChange,
  sortMode,
  onSortModeChange,
}: RecipeSelectionPanelProps) {
  const filteredRecipes = useMemo(() => {
    const byTerm = recipes.filter((recipe) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        recipe.title.toLowerCase().includes(term) ||
        (recipe.tags || []).some((tag) => tag.toLowerCase().includes(term)) ||
        (recipe.description ?? "").toLowerCase().includes(term)
      );
    });

    const bySort = [...byTerm];
    switch (sortMode) {
      case "alpha":
        bySort.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "tagged":
        bySort.sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0));
        break;
      default:
        bySort.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return bySort;
  }, [recipes, searchTerm, sortMode]);

  const counts = useMemo(() => {
    const allergenAware = filteredRecipes.filter((recipe) =>
      (recipe.tags || []).some((tag) => /gluten|nut|dairy|shellfish/i.test(tag)),
    );
    const beveragePairings = filteredRecipes.filter((recipe) =>
      (recipe.extra && typeof recipe.extra === "object" && "pairing" in recipe.extra) ||
      (recipe.tags || []).some((tag) => /wine|cocktail|pairing/i.test(tag)),
    );
    return {
      allergenAware: allergenAware.length,
      beveragePairings: beveragePairings.length,
    };
  }, [filteredRecipes]);

  return (
    <Card className="border-white/10 bg-slate-950/70 shadow-lg">
      <CardHeader className="gap-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">Recipe Selection</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Pull recipes directly from your library. Selected dishes appear in
              the preview and final briefing order.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
              {selectedIds.size} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:bg-white/10"
              onClick={() => onBulkRemove()}
              disabled={selectedIds.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search recipes, tags, or notes"
            className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-400"
          />
          <ToggleGroup
            type="single"
            value={sortMode}
            onValueChange={(value) => value && onSortModeChange(value as SortMode)}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem
              value="recent"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-wide text-slate-200 data-[state=on]:border-primary data-[state=on]:bg-primary/20"
            >
              Recent
            </ToggleGroupItem>
            <ToggleGroupItem
              value="alpha"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-wide text-slate-200 data-[state=on]:border-primary data-[state=on]:bg-primary/20"
            >
              A–Z
            </ToggleGroupItem>
            <ToggleGroupItem
              value="tagged"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-wide text-slate-200 data-[state=on]:border-primary data-[state=on]:bg-primary/20"
            >
              Featured Tags
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {filteredRecipes.length} available
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {counts.allergenAware} allergen flagged
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {counts.beveragePairings} pairings
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-white/20 bg-white/10 text-slate-100 hover:bg-white/20"
            onClick={() => {
              const recommended = filteredRecipes
                .slice(0, 6)
                .map((recipe) => recipe.id)
                .filter(Boolean);
              if (recommended.length) onBulkAdd(recommended);
            }}
            disabled={filteredRecipes.length === 0}
          >
            Add top matches
          </Button>
        </div>
      </CardHeader>
      <Separator className="border-white/5" />
      <CardContent className="p-0">
        <ScrollArea className="max-h-[26rem]">
          <div className="divide-y divide-white/5">
            {filteredRecipes.map((recipe) => {
              const isSelected = selectedIds.has(recipe.id);
              const primaryTag = recipe.tags?.[0];
              const secondaryTag = recipe.tags?.[1];
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => onToggle(recipe.id)}
                  className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition ${
                    isSelected
                      ? "bg-primary/10 text-white"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-white">
                        {recipe.title || "Untitled recipe"}
                      </span>
                      {primaryTag && (
                        <Badge variant="secondary" className="bg-sky-500/20 text-xs text-sky-100">
                          {primaryTag}
                        </Badge>
                      )}
                      {secondaryTag && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-xs text-amber-100">
                          {secondaryTag}
                        </Badge>
                      )}
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                      <span>
                        Added {new Date(recipe.createdAt).toLocaleDateString()}
                      </span>
                      {recipe.tags?.slice(2, 5).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(recipe.id)}
                    className="h-5 w-5"
                  />
                </button>
              );
            })}
            {filteredRecipes.length === 0 && (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                No recipes match that filter yet. Adjust search or add new recipes
                first.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
