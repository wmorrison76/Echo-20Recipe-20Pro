import { useAppData } from "@/context/AppDataContext";
import { useCallback, useMemo } from "react";
import { buildDictionary, fuzzyMatch, type FuzzyMatchOptions } from "@/lib/fuzzy";

export function useFuzzyAutocomplete(source: string[] | Set<string>) {
  const dictionary = useMemo(() => buildDictionary(source), [source]);

  return useCallback(
    (query: string, options?: FuzzyMatchOptions) =>
      fuzzyMatch(query, dictionary, options).map((entry) => entry.value),
    [dictionary],
  );
}

export function useRecipeNameSuggestions() {
  const { recipes } = useAppData();
  const names = useMemo(() => recipes.map((recipe) => recipe.title || ""), [recipes]);
  return useFuzzyAutocomplete(names);
}

export function useIngredientSuggestions() {
  const { recipes } = useAppData();

  const candidates = useMemo(() => {
    const extracted: string[] = [];
    for (const recipe of recipes) {
      const rows = recipe.ingredients || [];
      for (const row of rows) {
        const text = String(row || "").trim();
        if (!text) continue;
        const cleaned = text.replace(/^\s*[0-9]+(?:[\/\.,]\s*[0-9]+)?\s*[a-zA-Z\.\-]*\s*/i, "").trim();
        if (!cleaned) continue;
        extracted.push(cleaned);
      }
    }
    return buildDictionary(extracted);
  }, [recipes]);

  return useCallback(
    (query: string, options?: FuzzyMatchOptions) =>
      fuzzyMatch(query, candidates, options).map((entry) => entry.value),
    [candidates],
  );
}
