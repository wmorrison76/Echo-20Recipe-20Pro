import { useMemo, useState } from "react";
import { useAppData } from "@/context/AppDataContext";

export function RecipeCard({ r }: { r: ReturnType<typeof useAppData>["recipes"][number] }) {
  const cover = r.imageDataUrls?.[0];
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {cover ? (
        <img src={cover} alt={r.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-muted flex items-center justify-center text-muted-foreground">No Image</div>
      )}
      <div className="p-3">
        <h3 className="font-semibold leading-tight line-clamp-2">{r.title}</h3>
        {r.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {r.tags.slice(0, 5).map((t) => (
              <span key={t} className="text-xs rounded bg-secondary px-2 py-0.5 text-secondary-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {r.ingredients?.length ? (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
            {r.ingredients.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function RecipeSearchSection() {
  const { recipes, searchRecipes } = useAppData();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchRecipes(q), [q, searchRecipes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, ingredients, tags..."
          className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {results.length} / {recipes.length} recipes
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No recipes yet. Use the "Recipe Input" tab to import 50+ JSON recipes.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
