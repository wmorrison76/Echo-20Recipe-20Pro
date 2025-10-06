import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUp,
  ArrowDown,
  Grid3X3,
  List,
  ClipboardList,
  X,
  Wine,
  Utensils,
} from "lucide-react";
import { currencySymbol, type Recipe } from "@shared/recipes";
import type { ServerNoteRecipe } from "@shared/server-notes";
import { silverwareOptions } from "@shared/server-notes";

export type RecipeSelectionProps = {
  availableRecipes: Recipe[];
  selectedRecipes: ServerNoteRecipe[];
  onRecipesChange: (recipes: ServerNoteRecipe[]) => void;
};

const NUMERIC_KEYS = [
  "menuPrice",
  "menu_price",
  "price",
  "menuItemPrice",
  "menu_item_price",
  "sellingPrice",
  "selling_price",
];

const NAME_KEYS = [
  "menuName",
  "menu_item_name",
  "menuItemName",
  "menu_title",
  "menuTitle",
];

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,-]/g, "");
    const normalized = cleaned.replace(/,(?=\d{3}\b)/g, "").replace(/,/g, "");
    const numeric = Number.parseFloat(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const resolveMenuName = (recipe: Recipe): string => {
  const extra = (recipe.extra ?? {}) as Record<string, unknown>;
  for (const key of NAME_KEYS) {
    const raw = extra[key];
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim();
    }
  }
  return recipe.title;
};

const resolveMenuPrice = (recipe: Recipe): string | null => {
  const extra = (recipe.extra ?? {}) as Record<string, unknown>;
  let price: number | null = null;
  for (const key of NUMERIC_KEYS) {
    price = parseNumeric(extra[key]);
    if (price !== null) break;
  }
  if (price === null) return null;
  const currencyRaw = extra.currency || extra.currencyCode || extra.currency_code;
  const currency =
    typeof currencyRaw === "string" && currencyRaw.trim().length
      ? currencyRaw.trim().toUpperCase()
      : "USD";
  return `${currencySymbol(currency)}${price.toFixed(2)}`;
};

export function RecipeSelection({
  availableRecipes,
  selectedRecipes,
  onRecipesChange,
}: RecipeSelectionProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [filterCuisine, setFilterCuisine] = useState<string>("");

  const selectedIds = useMemo(
    () => new Set(selectedRecipes.map((item) => item.recipe.id)),
    [selectedRecipes],
  );

  const filteredRecipes = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return availableRecipes.filter((recipe) => {
      const matchesSearch =
        !lower ||
        recipe.title.toLowerCase().includes(lower) ||
        (recipe.description ?? "").toLowerCase().includes(lower) ||
        recipe.tags?.some((tag) => tag.toLowerCase().includes(lower));
      const matchesCourse = !filterCourse || recipe.course === filterCourse;
      const matchesCuisine = !filterCuisine || recipe.cuisine === filterCuisine;
      return matchesSearch && matchesCourse && matchesCuisine;
    });
  }, [availableRecipes, search, filterCourse, filterCuisine]);

  const toggleRecipe = (recipe: Recipe) => {
    const existing = selectedRecipes.find(
      (item) => item.recipe.id === recipe.id,
    );
    if (existing) {
      onRecipesChange(
        selectedRecipes.filter((item) => item.recipe.id !== recipe.id),
      );
    } else {
      onRecipesChange([
        ...selectedRecipes,
        {
          recipe,
          order: selectedRecipes.length,
          wineSelection: "",
          sellingNotes: "",
          serviceInstructions: "",
          silverwareRequired: [],
        },
      ]);
    }
  };

  const moveRecipe = (recipeId: string, direction: -1 | 1) => {
    const index = selectedRecipes.findIndex(
      (item) => item.recipe.id === recipeId,
    );
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedRecipes.length) return;
    const next = [...selectedRecipes];
    const [moved] = next.splice(index, 1);
    next.splice(newIndex, 0, moved);
    onRecipesChange(next.map((item, idx) => ({ ...item, order: idx })));
  };

  const updateRecipe = (recipeId: string, patch: Partial<ServerNoteRecipe>) => {
    onRecipesChange(
      selectedRecipes.map((item) =>
        item.recipe.id === recipeId ? { ...item, ...patch } : item,
      ),
    );
  };

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(availableRecipes.map((r) => r.course).filter(Boolean)),
      ) as string[],
    [availableRecipes],
  );
  const cuisineOptions = useMemo(
    () =>
      Array.from(
        new Set(availableRecipes.map((r) => r.cuisine).filter(Boolean)),
      ) as string[],
    [availableRecipes],
  );

  return (
    <div className="space-y-6">
      {selectedRecipes.length > 0 && (
        <Card>
          <CardHeader className="space-y-1 px-3.5 py-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                Selected Recipes ({selectedRecipes.length})
              </span>
              <Badge variant="secondary" className="text-[11px]">
                Reorder with arrows
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3.5 pb-3.5 pt-0">
            {selectedRecipes.map((entry, index) => (
              <div
                key={entry.recipe.id}
                className="rounded-lg border p-2.5 text-[13px]"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5.5 w-5.5"
                      onClick={() => moveRecipe(entry.recipe.id, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5.5 w-5.5"
                      onClick={() => moveRecipe(entry.recipe.id, 1)}
                      disabled={index === selectedRecipes.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <img
                    src={
                      entry.recipe.imageDataUrls?.[0] ||
                      entry.recipe.image ||
                      "https://cdn.builder.io/api/v1/image/assets%2Fplaceholder"
                    }
                    alt={entry.recipe.title}
                    className="h-14 w-14 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-[13px] font-medium">
                          {entry.recipe.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {entry.recipe.course || "—"} •{" "}
                          {entry.recipe.cuisine || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <Badge variant="outline" className="text-[11px]">
                          #{index + 1}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExpanded(
                              expanded === entry.recipe.id
                                ? null
                                : entry.recipe.id,
                            )
                          }
                          aria-label="Toggle details"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRecipe(entry.recipe)}
                          aria-label="Remove recipe"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expanded === entry.recipe.id && (
                      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`wine-${entry.recipe.id}`}
                            className="flex items-center gap-1.5 text-[11px]"
                          >
                            <Wine className="h-3 w-3" /> Wine Pairing &
                            Selection
                          </Label>
                          <Textarea
                            id={`wine-${entry.recipe.id}`}
                            placeholder="Recommended pairings, glass pours, upsell notes..."
                            value={entry.wineSelection || ""}
                            onChange={(event) =>
                              updateRecipe(entry.recipe.id, {
                                wineSelection: event.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`sell-${entry.recipe.id}`}
                            className="text-[11px]"
                          >
                            Server Selling Notes
                          </Label>
                          <Textarea
                            id={`sell-${entry.recipe.id}`}
                            placeholder="Talking points, ingredient sourcing, flavor highlights..."
                            value={entry.sellingNotes || ""}
                            onChange={(event) =>
                              updateRecipe(entry.recipe.id, {
                                sellingNotes: event.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`service-${entry.recipe.id}`}
                            className="text-[11px]"
                          >
                            Service Instructions
                          </Label>
                          <Textarea
                            id={`service-${entry.recipe.id}`}
                            placeholder="Pass timing, finishing garnish, plating calls..."
                            value={entry.serviceInstructions || ""}
                            onChange={(event) =>
                              updateRecipe(entry.recipe.id, {
                                serviceInstructions: event.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5 text-[11px]">
                            <Utensils className="h-3 w-3" /> Required Silverware
                          </Label>
                          <div className="grid max-h-32 grid-cols-2 gap-1.5 overflow-y-auto text-xs">
                            {silverwareOptions.map((item) => {
                              const checked =
                                entry.silverwareRequired?.includes(item) ??
                                false;
                              return (
                                <div
                                  key={item}
                                  className="flex items-center gap-1.5"
                                >
                                  <Checkbox
                                    id={`${entry.recipe.id}-${item}`}
                                    checked={checked}
                                    onCheckedChange={(state) => {
                                      const set = new Set(
                                        entry.silverwareRequired ?? [],
                                      );
                                      if (state) {
                                        set.add(item);
                                      } else {
                                        set.delete(item);
                                      }
                                      updateRecipe(entry.recipe.id, {
                                        silverwareRequired: Array.from(set),
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`${entry.recipe.id}-${item}`}
                                    className="text-[11px]"
                                  >
                                    {item}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-2 px-3.5 py-3">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-medium">Available Recipes</span>
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <Input
                placeholder="Search recipes, tags, notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full min-w-[200px] md:w-60"
              />
              <select
                value={filterCourse}
                onChange={(event) => setFilterCourse(event.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-[11px]"
              >
                <option value="">Course</option>
                {courseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <select
                value={filterCuisine}
                onChange={(event) => setFilterCuisine(event.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-[11px]"
              >
                <option value="">Cuisine</option>
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <Button
                  variant={view === "grid" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3.5 pb-3.5 pt-0">
          <div
            className={
              view === "grid"
                ? "grid gap-3 sm:grid-cols-2 2xl:grid-cols-3"
                : "grid gap-3"
            }
          >
            {filteredRecipes.map((recipe) => {
              const isSelected = selectedIds.has(recipe.id);
              const menuName = resolveMenuName(recipe);
              const menuPrice = resolveMenuPrice(recipe);
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => toggleRecipe(recipe)}
                  className={`flex h-full flex-col items-center gap-2 rounded-lg border p-3 text-[13px] text-center transition ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-foreground/40"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        recipe.imageDataUrls?.[0] ||
                        recipe.image ||
                        "https://cdn.builder.io/api/v1/image/assets%2Fplaceholder"
                      }
                      alt={recipe.title}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Selected
                      </div>
                    )}
                  </div>
                  <div className="flex w-full flex-1 flex-col items-center gap-2">
                    <div className="space-y-1 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1 text-[13px] font-semibold">
                        <span className="line-clamp-2 max-w-[220px]">{menuName}</span>
                        {menuPrice && (
                          <span className="text-[12px] font-medium text-primary/80">
                            {menuPrice}
                          </span>
                        )}
                        <span
                          className={`inline-flex h-[9px] w-[9px] rounded-[2px] shadow-sm ${
                            isSelected ? "bg-primary" : "bg-muted-foreground/50"
                          }`}
                          aria-hidden
                        />
                      </div>
                      <p className="line-clamp-3 text-[11px] text-muted-foreground">
                        {recipe.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                      {recipe.course && (
                        <Badge variant="secondary">{recipe.course}</Badge>
                      )}
                      {recipe.cuisine && (
                        <Badge variant="outline">{recipe.cuisine}</Badge>
                      )}
                      {recipe.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                      {typeof recipe.prepTime === "number" &&
                        typeof recipe.cookTime === "number" && (
                          <span>
                            {recipe.prepTime + recipe.cookTime} min total
                          </span>
                        )}
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredRecipes.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No recipes match that filter. Adjust search or add new entries
                first.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
