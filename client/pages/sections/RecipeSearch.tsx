import { useMemo, useState } from "react";
import { useAppData } from "@/context/AppDataContext";

export function RecipeCard({ r }: { r: ReturnType<typeof useAppData>["recipes"][number] }) {
  const cover = r.imageDataUrls?.[0];
  return (
    <a href={`/recipe/${r.id}`} className="block rounded-xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md overflow-hidden">
      <div className="grid grid-cols-[120px_1fr] gap-4 p-4 items-start">
        {cover ? (
          <img src={cover} alt={r.title} className="h-[120px] w-[120px] object-cover rounded" />
        ) : (
          <div className="h-[120px] w-[120px] bg-muted rounded flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h2 className="m-0">{r.title}</h2>
          {r.tags?.length ? (
            <p className="m-0 text-xs text-muted-foreground">{r.tags.slice(0,5).join(' · ')}</p>
          ) : null}
          {r.ingredients?.length ? (
            <p className="mt-2 mb-0 text-xs text-muted-foreground line-clamp-3">{r.ingredients.join(', ')}</p>
          ) : null}
        </div>
      </div>
    </a>
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
          No recipes yet. Add recipes on the Input tab.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground text-center">Total recipes in system: {recipes.length}</div>
    </div>
  );
}
