import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TopTabs from "@/components/TopTabs";
import SubtleBottomGlow from "@/components/SubtleBottomGlow";
import CornerBrand from "@/components/CornerBrand";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import type { RecipeNutrition } from "@shared/recipes";

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

const nutritionFieldConfig: Array<{
  key: keyof RecipeNutrition;
  label: string;
  unit: string;
}> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugars", label: "Sugars", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
];

type NutritionValuesState = Record<keyof RecipeNutrition, string>;

const createEmptyNutritionValues = (): NutritionValuesState => ({
  calories: "",
  fat: "",
  carbs: "",
  protein: "",
  fiber: "",
  sugars: "",
  sodium: "",
  cholesterol: "",
});

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function RecipeEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const { getRecipeById, updateRecipe } = useAppData();
  const { toast } = useToast();
  const recipe = useMemo(() => (id ? getRecipeById(id) : undefined), [id, getRecipeById]);

  const [localTitle, setLocalTitle] = useState<string>("");
  const [allergens, setAllergens] = useState<string>("");
  const [cookTime, setCookTime] = useState<string>("");
  const [cookTemp, setCookTemp] = useState<string>("");
  const [directionsText, setDirectionsText] = useState<string>("");
  const [directionImages, setDirectionImages] = useState<string[]>([]);
  const [nutritionValues, setNutritionValues] = useState<NutritionValuesState>(createEmptyNutritionValues);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);

  const directionImageInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!recipe) return;
    const extra = (recipe.extra ?? {}) as Record<string, unknown>;
    setLocalTitle(recipe.title ?? "");
    setAllergens(String(extra.allergens ?? ""));
    setCookTime(String(extra.cookTime ?? ""));
    setCookTemp(String(extra.cookTemp ?? ""));
    const rawDirections = String(extra.directions ?? (recipe.instructions ?? []).join("\n") ?? "");
    const lines = rawDirections
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const imageLines = lines.filter((line) => line.startsWith("IMG:"));
    const plainLines = lines.filter((line) => !line.startsWith("IMG:"));
    setDirectionsText(plainLines.join("\n"));
    setDirectionImages(
      imageLines
        .map((line) => line.slice(4))
        .filter((src) => typeof src === "string" && src.length > 0),
    );
    const nutritionSource = (extra.nutrition as RecipeNutrition | undefined) ?? recipe.nutrition ?? null;
    const nextNutrition = createEmptyNutritionValues();
    if (nutritionSource) {
      for (const { key } of nutritionFieldConfig) {
        const value = nutritionSource[key];
        if (value !== undefined && value !== null) {
          nextNutrition[key] = String(value);
        }
      }
    }
    setNutritionValues(nextNutrition);
    setCoverPreview(recipe.imageDataUrls?.[0] ?? recipe.image ?? undefined);
  }, [recipe]);

  const allergenList = useMemo(
    () =>
      allergens
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [allergens],
  );

  const handleDirectionImageFiles = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setDirectionImages((prev) => [...prev, ...dataUrls]);
    } catch (error) {
      console.error("Failed to read direction images", error);
    }
  }, []);

  const handleCoverFileChange = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    try {
      const dataUrl = await fileToDataUrl(list[0]!);
      setCoverPreview(dataUrl);
    } catch (error) {
      console.error("Failed to read cover image", error);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!recipe) return;

    const directionLines = directionsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const combinedDirections = [...directionLines, ...directionImages.map((src) => `IMG:${src}`)].join("\n");

    const nutritionEntries = nutritionFieldConfig
      .map(({ key }) => {
        const raw = (nutritionValues as Record<string, string>)[key] ?? "";
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) return null;
        return [key, numeric] as [keyof RecipeNutrition, number];
      })
      .filter((entry): entry is [keyof RecipeNutrition, number] => Array.isArray(entry));

    const nutritionPayload = nutritionEntries.length
      ? (Object.fromEntries(nutritionEntries) as RecipeNutrition)
      : null;

    updateRecipe(recipe.id, {
      title: localTitle.trim() || "Untitled",
      instructions: combinedDirections ? combinedDirections.split(/\r?\n/) : undefined,
      nutrition: nutritionPayload,
      imageDataUrls: coverPreview
        ? [coverPreview, ...(recipe.imageDataUrls ?? []).slice(1)]
        : recipe.imageDataUrls,
      image: coverPreview ?? recipe.image,
      extra: {
        ...(recipe.extra ?? {}),
        allergens,
        cookTime,
        cookTemp,
        directions: combinedDirections,
        directionImages,
        nutrition: nutritionPayload ?? undefined,
      },
    });

    toast({ title: "Recipe updated", description: "Changes saved successfully." });
  }, [
    recipe,
    directionsText,
    directionImages,
    nutritionValues,
    localTitle,
    coverPreview,
    allergens,
    cookTime,
    cookTemp,
    updateRecipe,
    toast,
  ]);

  if (!recipe) {
    return (
      <div className="p-6">
        <div className="mb-4 text-sm text-muted-foreground">Recipe not found.</div>
        <div className="flex items-center gap-2">
          <Button onClick={() => nav("/")}>Back</Button>
          <a href="/" className="text-sm underline">
            Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopTabs />
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Edit Recipe</h1>
            <p className="text-sm text-muted-foreground">
              Update presentation details, directions, and nutrition for this recipe.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => nav(-1)}>
              Back
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">General Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Labeled label="Recipe Name">
                    <Input value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} placeholder="House Burger" />
                  </Labeled>
                  <Labeled label="Allergens">
                    <Input value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="Gluten, Dairy" />
                  </Labeled>
                  <Labeled label="Cook Time">
                    <Input value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="2:30" />
                  </Labeled>
                  <Labeled label="Cook Temp">
                    <Input value={cookTemp} onChange={(e) => setCookTemp(e.target.value)} placeholder="350F" />
                  </Labeled>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <IngredientsTable recipeId={recipe.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 pb-4">
                <div className="flex w-full items-center justify-between gap-3">
                  <CardTitle className="text-base">Directions</CardTitle>
                  <div className="flex items-center gap-2">
                    <input
                      ref={directionImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => {
                        void handleDirectionImageFiles(event.target.files);
                        if (event.target) event.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => directionImageInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Add photos
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Write step-by-step directions. Photos attach below and will display at the end of the instructions.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={directionsText}
                  onChange={(e) => setDirectionsText(e.target.value)}
                  rows={8}
                  placeholder={"1. Preheat oven to 350F\n2. Toast buns and prep toppings"}
                  className="min-h-[180px]"
                />
                {directionImages.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {directionImages.map((src, index) => (
                        <div key={`${src.slice(0, 32)}-${index}`} className="group relative overflow-hidden rounded-lg border bg-muted/30">
                          <img src={src} alt={`Step visual ${index + 1}`} className="h-40 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setDirectionImages((prev) => prev.filter((_, idx) => idx !== index))
                            }
                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground shadow hover:text-destructive"
                            aria-label="Remove step photo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Nutrition</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Enter available nutrition facts. Leave fields blank if values are unknown.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {nutritionFieldConfig.map(({ key, label, unit }) => (
                    <Labeled key={key} label={`${label} (${unit})`}>
                      <Input
                        inputMode="decimal"
                        value={nutritionValues[key]}
                        onChange={(e) =>
                          setNutritionValues((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </Labeled>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cover Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                  {coverPreview ? (
                    <img src={coverPreview} alt={recipe.title} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center text-sm text-muted-foreground">
                      No cover image yet
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    void handleCoverFileChange(event.target.files);
                    if (event.target) event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? "Replace Photo" : "Upload Photo"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Allergens</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allergenList.length ? (
                      allergenList.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None listed</span>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Cook Time</div>
                    <div className="font-medium">{cookTime || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Cook Temp</div>
                    <div className="font-medium">{cookTemp || "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs uppercase text-muted-foreground">Directions Photos</div>
                    <div className="font-medium">{directionImages.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      <SubtleBottomGlow />
      <CornerBrand />
    </>
  );
}

function IngredientsTable({ recipeId }: { recipeId: string }) {
  const { getRecipeById, updateRecipe } = useAppData();
  const recipe = getRecipeById(recipeId)!;
  type Row = {
    qty?: string;
    unit?: string;
    item?: string;
    prep?: string;
    yield?: string;
    cost?: string;
    subId?: string;
  };
  const rows: Row[] =
    ((recipe.extra as any)?.ingredientsTable as Row[] | undefined) ??
    Array.from({ length: 10 }, () => ({ qty: "", unit: "", item: "", prep: "", yield: "", cost: "", subId: "" }));

  const setRow = (idx: number, patch: Partial<Row>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    updateRecipe(recipeId, { extra: { ...(recipe.extra ?? {}), ingredientsTable: next } });
  };

  return (
    <div className="w-full overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr className="text-left">
            <th className="p-2">QTY</th>
            <th className="p-2">UNIT</th>
            <th className="p-2">ITEM</th>
            <th className="p-2">PREP</th>
            <th className="p-2">YIELD %</th>
            <th className="p-2">COST</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-1">
                <input
                  value={r.qty ?? ""}
                  onChange={(e) => setRow(i, { qty: e.target.value })}
                  className="w-20 rounded border bg-background px-2 py-1"
                />
              </td>
              <td className="p-1">
                <input
                  value={r.unit ?? ""}
                  onChange={(e) => setRow(i, { unit: e.target.value })}
                  className="w-24 rounded border bg-background px-2 py-1"
                />
              </td>
              <td className="p-1">
                <input
                  value={r.item ?? ""}
                  onChange={(e) => setRow(i, { item: e.target.value })}
                  className="w-full rounded border bg-background px-2 py-1"
                />
              </td>
              <td className="p-1">
                <input
                  value={r.prep ?? ""}
                  onChange={(e) => setRow(i, { prep: e.target.value })}
                  className="w-32 rounded border bg-background px-2 py-1"
                />
              </td>
              <td className="p-1">
                <input
                  value={r.yield ?? ""}
                  onChange={(e) => setRow(i, { yield: e.target.value })}
                  className="w-24 rounded border bg-background px-2 py-1"
                />
              </td>
              <td className="p-1">
                <input
                  value={r.cost ?? ""}
                  onChange={(e) => setRow(i, { cost: e.target.value })}
                  className="w-24 rounded border bg-background px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
