import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Recipe } from "@/context/AppDataContext";
import type { ServerNotesConfig } from "./shared";
import { layoutPresets, orientationLabels, outletOptions } from "./shared";
import { toast } from "@/hooks/use-toast";

type PreviewPanelProps = {
  config: ServerNotesConfig;
  selectedRecipes: Recipe[];
  onGenerate: () => void;
};

export function PreviewPanel({ config, selectedRecipes, onGenerate }: PreviewPanelProps) {
  const preset = layoutPresets.find((item) => item.id === config.layoutId);
  const outlet = outletOptions.find((item) => item.id === config.outlet);

  const previewBlocks = useMemo(() => {
    return selectedRecipes.map((recipe, index) => {
      const allergens = (recipe.tags || []).filter((tag) =>
        /gluten|dairy|nut|shellfish|soy|egg|sesame/i.test(tag),
      );
      const pairing =
        typeof recipe.extra === "object" && recipe.extra !== null && "pairing" in recipe.extra
          ? String((recipe.extra as Record<string, unknown>).pairing || "")
          : null;
      return {
        id: recipe.id,
        index: index + 1,
        title: recipe.title || "Untitled recipe",
        description: recipe.description || "",
        allergens,
        pairing,
      };
    });
  }, [selectedRecipes]);

  const handleGenerate = () => {
    onGenerate();
    toast({
      title: "Server Notes drafted",
      description: `${selectedRecipes.length} course${selectedRecipes.length === 1 ? "" : "s"} queued with the ${preset?.name ?? "custom"} layout.`,
    });
  };

  return (
    <Card className="border-white/10 bg-slate-950/70 shadow-lg">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">
              Preview & Generate
            </CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Review the briefing exactly as service receives it. Adjust
              selections or configuration and regenerate instantly.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-100">
              {preset?.name ?? "Custom layout"}
            </Badge>
            <Badge variant="outline" className="border-white/20 bg-white/10 text-xs text-white">
              {orientationLabels[config.orientation]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Outlet: {outlet?.name ?? "All Outlets"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Service notes: {config.includeServiceNotes ? "on" : "off"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Allergens: {config.includeAllergens ? "visible" : "hidden"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Pairings: {config.includePairings ? "included" : "omitted"}
          </span>
        </div>
      </CardHeader>
      <Separator className="border-white/5" />
      <CardContent className="p-0">
        <ScrollArea className="max-h-[24rem]">
          <div className="space-y-6 px-6 py-6">
            {previewBlocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
                Select recipes on the left to stage a briefing. You can adjust
                configuration at any time before generating.
              </div>
            )}
            {previewBlocks.map((block) => (
              <article
                key={block.id}
                className="rounded-xl border border-white/10 bg-black/40 p-5 shadow-inner"
              >
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Course {block.index}
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      {block.title}
                    </h3>
                  </div>
                  {config.includeChefNotes && (
                    <Badge variant="outline" className="border-amber-400/60 bg-amber-400/10 text-amber-100">
                      Chef sign-off required
                    </Badge>
                  )}
                </header>
                {block.description && (
                  <p className="mt-2 text-sm text-slate-300">
                    {block.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {config.includeAllergens && block.allergens.length > 0 && (
                    <div className="flex items-center gap-2 rounded-full border border-red-400/60 bg-red-500/10 px-3 py-1 text-red-100">
                      <span className="font-semibold">Allergens</span>
                      <span>{block.allergens.join(", ")}</span>
                    </div>
                  )}
                  {config.includePairings && block.pairing && (
                    <div className="flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-3 py-1 text-indigo-100">
                      <span className="font-semibold">Pairing</span>
                      <span>{block.pairing}</span>
                    </div>
                  )}
                  {config.includeServiceNotes && (
                    <div className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                      Pace: 6 min fire / 4 min pass
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <Separator className="border-white/5" />
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {previewBlocks.length > 0
            ? `${previewBlocks.length} course${previewBlocks.length === 1 ? "" : "s"} staged`
            : "No courses staged yet"}
        </div>
        <Button
          size="lg"
          className="bg-primary px-6 text-base font-semibold"
          onClick={handleGenerate}
          disabled={previewBlocks.length === 0}
        >
          Generate Server Notes Document
        </Button>
      </CardFooter>
    </Card>
  );
}
