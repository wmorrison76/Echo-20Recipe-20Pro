import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppData, type Recipe } from "@/context/AppDataContext";
import { LayoutPresetPanel } from "./LayoutPresetPanel";
import { RecipeSelectionPanel } from "./RecipeSelectionPanel";
import { PreviewPanel } from "./PreviewPanel";
import {
  DEFAULT_CONFIG,
  layoutPresets,
  type ServerNotesConfig,
} from "./shared";

const CONFIG_KEY = "server-notes.config.v1";
const SELECTION_KEY = "server-notes.selection.v1";

type SortMode = "recent" | "alpha" | "tagged";

function readConfig(): ServerNotesConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ServerNotesConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function readSelection(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SELECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export default function ServerNotesSection() {
  const { recipes } = useAppData();
  const [config, setConfig] = useState<ServerNotesConfig>(() => readConfig());
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(() => readSelection());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SELECTION_KEY, JSON.stringify(selectedRecipeIds));
  }, [selectedRecipeIds]);

  const selectedIds = useMemo(() => new Set(selectedRecipeIds), [selectedRecipeIds]);

  const selectedRecipes = useMemo(() => {
    const map = new Map(recipes.map((recipe) => [recipe.id, recipe] as const));
    return selectedRecipeIds
      .map((id) => map.get(id))
      .filter((recipe): recipe is Recipe => Boolean(recipe));
  }, [recipes, selectedRecipeIds]);

  const handleToggleRecipe = useCallback((id: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleBulkAdd = useCallback((ids: string[]) => {
    setSelectedRecipeIds((prev) => {
      const merged = new Set(prev);
      ids.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  }, []);

  const handleBulkClear = useCallback(() => {
    setSelectedRecipeIds([]);
  }, []);

  const handleConfigChange = useCallback((next: ServerNotesConfig) => {
    setConfig(next);
  }, []);

  const resetDocument = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setSelectedRecipeIds([]);
    setSearchTerm("");
    setSortMode("recent");
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedRecipes.length === 0 || typeof window === "undefined") return;
    const preset = layoutPresets.find((item) => item.id === config.layoutId);
    const timestamp = new Date();
    const heading = `Server Notes — ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}\n`; // newline ending
    const meta = [
      `Outlet: ${config.outlet}`,
      `Layout: ${preset?.name ?? config.layoutId}`,
      `Orientation: ${config.orientation}`,
      `Service notes: ${config.includeServiceNotes ? "enabled" : "disabled"}`,
      `Allergens: ${config.includeAllergens ? "visible" : "hidden"}`,
      `Pairings: ${config.includePairings ? "included" : "omitted"}`,
      `Chef sign-off: ${config.includeChefNotes ? "required" : "optional"}`,
    ].join("\n");

    const body = selectedRecipes
      .map((recipe, index) => {
        const parts = [`#${index + 1} ${recipe.title || "Untitled"}`];
        if (config.includeServiceNotes) {
          parts.push("Service: Stage at pass, fire 6 / pass 4 minutes");
        }
        if (config.includeAllergens && recipe.tags?.length) {
          const allergenTags = recipe.tags.filter((tag) =>
            /gluten|dairy|nut|shellfish|soy|egg|sesame/i.test(tag),
          );
          if (allergenTags.length) {
            parts.push(`Allergens: ${allergenTags.join(", ")}`);
          }
        }
        if (config.includePairings && recipe.extra && typeof recipe.extra === "object") {
          const pairing = (recipe.extra as Record<string, unknown>).pairing;
          if (typeof pairing === "string" && pairing.trim()) {
            parts.push(`Pairing: ${pairing.trim()}`);
          }
        }
        if (recipe.description) {
          parts.push(recipe.description);
        }
        return parts.join("\n");
      })
      .join("\n\n");

    const content = `${heading}${meta}\n\n${body}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `server-notes-${Date.now()}.txt`;
    anchor.rel = "noopener";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [config, selectedRecipes]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Server Notes
          </h1>
          <p className="text-sm text-slate-300">
            Merge recipes, pacing, and allergen signals into a brief that keeps
            front-of-house and the pass aligned.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
            onClick={resetDocument}
          >
            Reset
          </Button>
          <Button className="bg-primary px-5" onClick={handleGenerate} disabled={selectedRecipes.length === 0}>
            New Document
          </Button>
        </div>
      </header>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <LayoutPresetPanel
            presets={layoutPresets}
            config={config}
            onConfigChange={handleConfigChange}
          />
          <RecipeSelectionPanel
            recipes={recipes}
            selectedIds={selectedIds}
            onToggle={handleToggleRecipe}
            onBulkAdd={handleBulkAdd}
            onBulkRemove={handleBulkClear}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
          />
        </div>
        <PreviewPanel
          config={config}
          selectedRecipes={selectedRecipes}
          onGenerate={handleGenerate}
        />
      </div>
    </section>
  );
}
