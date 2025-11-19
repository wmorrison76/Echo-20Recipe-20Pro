import { RecipeCodexService } from "../services/recipeCodexService";
import { RecipeVectorSearchResult } from "../services/recipeVectorStore";
import type { FlavorBalance, RecipeCodexMetadata } from "../codex";

export interface ChefBrainQuery {
  userPrompt: string;
  queryEmbedding: number[];
  dietaryTags?: string[];
  avoidAllergens?: string[];
  maxComplexity?: 1 | 2 | 3 | 4 | 5;
}

export interface ChefBrainSuggestion {
  type: "existing_recipe" | "variation" | "new_concept";
  baseRecipe?: RecipeCodexMetadata;
  title: string;
  description: string;
  recommendedChanges?: string[];
  flavorBalanceHint?: FlavorBalance;
  serviceNotes?: string;
}

export class EchoChefBrain {
  static async suggestRecipes(
    query: ChefBrainQuery
  ): Promise<ChefBrainSuggestion[]> {
    const filters: Partial<RecipeCodexMetadata> = {};

    if (query.maxComplexity) {
      (filters as any).complexity = { $lte: query.maxComplexity };
    }

    const results: RecipeVectorSearchResult[] =
      await RecipeCodexService.searchByQueryEmbedding(query.queryEmbedding, {
        topK: 10,
        filters,
      });

    const suggestions: ChefBrainSuggestion[] = [];

    results.slice(0, 3).forEach((r) => {
      suggestions.push({
        type: "existing_recipe",
        baseRecipe: r.metadata,
        title: r.metadata.title,
        description: `This recipe aligns strongly with your request based on flavor, technique, and service context. Relevance score: ${r.score.toFixed(
          3
        )}.`,
      });
    });

    results.slice(3, 6).forEach((r) => {
      const changes: string[] = [];

      if (
        query.dietaryTags?.includes("gluten_free") &&
        !r.metadata.dietaryTags.includes("gluten_free")
      ) {
        changes.push(
          "Replace any wheat-based components with certified gluten-free alternatives."
        );
      }

      if (
        query.dietaryTags?.includes("vegetarian") &&
        !r.metadata.dietaryTags.includes("vegetarian")
      ) {
        changes.push(
          "Swap animal proteins with high-umami plant proteins while keeping the core flavor structure."
        );
      }

      if (
        query.dietaryTags?.includes("vegan") &&
        !r.metadata.dietaryTags.includes("vegan")
      ) {
        changes.push(
          "Replace all animal products with plant-based equivalents, maintaining umami depth through miso, soy, or mushroom bases."
        );
      }

      if (query.avoidAllergens?.length) {
        const recipAllergens = r.metadata.allergens;
        const toAvoid = query.avoidAllergens.filter((a) =>
          recipAllergens.includes(a)
        );

        toAvoid.forEach((allergen) => {
          changes.push(
            `Remove or substitute ${allergen} with a safe alternative.`
          );
        });
      }

      suggestions.push({
        type: "variation",
        baseRecipe: r.metadata,
        title: `${r.metadata.title} – Chef Echo Variation`,
        description:
          "Based on a strong culinary match, this variation adjusts the recipe to better meet your constraints while preserving core flavors.",
        recommendedChanges: changes.length > 0 ? changes : undefined,
      });
    });

    const top = results[0];
    if (top) {
      suggestions.push({
        type: "new_concept",
        baseRecipe: top.metadata,
        title: `Concept: ${
          top.metadata.cuisineRegion ?? "Echo"
        }-Inspired ${top.metadata.category.toUpperCase()}`,
        description:
          "Using patterns from similar recipes, Echo suggests a new concept that preserves the flavor foundation but transforms plating, garnish, and service context for a fresh menu item.",
        flavorBalanceHint: {
          sweet: 0.2,
          sour: 0.3,
          salty: 0.6,
          bitter: 0.1,
          umami: 0.8,
          fat: 0.5,
          spice: 0.2,
          aromatic: 0.7,
        },
        serviceNotes:
          "Designed to work for both à la carte and banquet plating with minimal last-minute à la minute exposure.",
      });
    }

    return suggestions;
  }
}
