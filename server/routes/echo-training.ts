import { Router, Request, Response } from "express";
import { generateEmbedding, storeRecipeVector } from "../lib/vector-engine";
import type { RecipeCodexMetadata } from "../../client/echo/codex";
import {
  extractDefinitionsFromPdfText,
  formatDefinitionsForBuilder,
} from "../lib/pdf-definition-extractor";

const router = Router();

interface StoreRecipeRequest {
  recipe: {
    id: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    sourceBook: string;
    sourcePage: number;
    cuisine?: string;
    course?: string;
    difficulty?: string;
    prepTime?: string;
    cookTime?: string;
    yield?: string;
    tags?: string[];
  };
  codexMetadata: RecipeCodexMetadata;
  bookName: string;
}

/**
 * POST /api/echo-training/store-recipe
 * Store an imported recipe with full codex metadata in vector store
 * Enriches recipe for EchoChefBrain suggestions
 */
router.post("/store-recipe", async (req: Request, res: Response) => {
  try {
    const { recipe, codexMetadata, bookName } = req.body as StoreRecipeRequest;

    if (!recipe?.id || !recipe?.title) {
      return res.status(400).json({ error: "Recipe ID and title required" });
    }

    // Build searchable text for embedding
    const recipeText = `
Recipe: ${recipe.title}
Ingredients: ${recipe.ingredients.join(", ")}
Instructions: ${recipe.instructions.join(" ")}
${recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : ""}
${recipe.course ? `Course: ${recipe.course}` : ""}
Complexity: ${codexMetadata.complexity}/5
Techniques: ${codexMetadata.primaryTechniques.join(", ")}
Dietary: ${codexMetadata.dietaryTags.join(", ")}
Flavor Profile: ${codexMetadata.flavorProfile.join(", ")}
Source: ${bookName} (Page ${recipe.sourcePage})
    `.trim();

    // Generate embedding using existing vector engine
    const embedding = await generateEmbedding(recipeText);

    // Enrich tags with source and codex info
    const enrichedTags = [
      ...(recipe.tags || []),
      `source:${bookName.replace(/\s+/g, "-")}`,
      `page:${recipe.sourcePage}`,
      "echo-training",
      "codex-indexed",
      ...codexMetadata.dietaryTags.map((t) => `dietary:${t}`),
      ...codexMetadata.allergens.map((a) => `allergen:${a}`),
    ];

    // Store vector with full codex metadata
    try {
      await storeRecipeVector(
        {
          id: recipe.id,
          title: recipe.title,
          description: recipeText,
          ingredients: recipe.ingredients,
          cuisine: recipe.cuisine,
          course: recipe.course,
          difficulty: recipe.difficulty,
          tags: enrichedTags,
          prepTime: recipe.prepTime ? parseInt(recipe.prepTime) : undefined,
          cookTime: recipe.cookTime ? parseInt(recipe.cookTime) : undefined,
        },
        "manufacturing", // Track
        "echo-system", // Chef
        "global-knowledge", // Organization (global for all users to benefit)
      );
    } catch (storeError) {
      console.error("[EchoTraining] Vector storage failed:", storeError);
      return res.status(500).json({
        success: false,
        error: "Failed to store recipe vector",
      });
    }

    return res.json({
      success: true,
      recipeId: recipe.id,
      title: recipe.title,
      message: `Recipe stored and indexed for EchoChefBrain suggestions`,
    });
  } catch (error: any) {
    console.error("[EchoTraining] Store recipe failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * POST /api/echo-training/batch-store-recipes
 * Store multiple recipes from a textbook in batch
 * Returns progress and final counts
 */
router.post("/batch-store-recipes", async (req: Request, res: Response) => {
  try {
    const { recipes, bookName } = req.body as {
      recipes: StoreRecipeRequest["recipe"][];
      bookName: string;
      codexMetadata?: Record<string, RecipeCodexMetadata>;
    };

    if (!recipes || recipes.length === 0) {
      return res.status(400).json({ error: "Recipes array required" });
    }

    const results = {
      total: recipes.length,
      success: 0,
      failed: 0,
      recipes: [] as Array<{
        id: string;
        title: string;
        success: boolean;
        error?: string;
      }>,
    };

    for (const recipe of recipes) {
      try {
        // Map to codex metadata if not provided
        const codexMetadata = mapRecipeToCodex(recipe);

        const recipeText = `
Recipe: ${recipe.title}
Ingredients: ${recipe.ingredients.join(", ")}
Instructions: ${recipe.instructions.join(" ")}
${recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : ""}
${recipe.course ? `Course: ${recipe.course}` : ""}
Complexity: ${codexMetadata.complexity}/5
Source: ${bookName} (Page ${recipe.sourcePage})
        `.trim();

        const embedding = await generateEmbedding(recipeText);

        const enrichedTags = [
          ...(recipe.tags || []),
          `source:${bookName.replace(/\s+/g, "-")}`,
          `page:${recipe.sourcePage}`,
          "echo-training",
        ];

        await storeRecipeVector(
          {
            id: recipe.id,
            title: recipe.title,
            description: recipeText,
            ingredients: recipe.ingredients,
            cuisine: recipe.cuisine,
            tags: enrichedTags,
          },
          "manufacturing",
          "echo-system",
          "global-knowledge",
        );

        results.success++;
        results.recipes.push({
          id: recipe.id,
          title: recipe.title,
          success: true,
        });
      } catch (error) {
        results.failed++;
        results.recipes.push({
          id: recipe.id,
          title: recipe.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.json(results);
  } catch (error: any) {
    console.error("[EchoTraining] Batch store failed:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

// Helper to map recipe to basic codex metadata
function mapRecipeToCodex(recipe: any): RecipeCodexMetadata {
  return {
    id: recipe.id,
    title: recipe.title,
    category: inferCategory(recipe.course, recipe.title),
    cuisineRegion: recipe.cuisine,
    yieldDescription: recipe.yield,
    complexity: inferComplexity(recipe.difficulty, recipe.cookTime),
    primaryTechniques: [],
    mainIngredients: recipe.ingredients.slice(0, 5),
    dietaryTags: [],
    allergens: [],
    flavorProfile: [],
  };
}

function inferCategory(course: string | undefined, title: string) {
  const text = `${course} ${title}`.toLowerCase();
  if (text.includes("appetizer") || text.includes("starter"))
    return "appetizer";
  if (text.includes("salad")) return "salad";
  if (text.includes("soup")) return "soup";
  if (text.includes("dessert")) return "dessert";
  if (text.includes("sauce")) return "sauce";
  return "entree";
}

function inferComplexity(
  difficulty: string | undefined,
  cookTime: string | undefined,
): 1 | 2 | 3 | 4 | 5 {
  if (difficulty) {
    const lower = difficulty.toLowerCase();
    if (lower.includes("easy")) return 1;
    if (lower.includes("simple")) return 2;
    if (lower.includes("intermediate")) return 3;
    if (lower.includes("advanced")) return 4;
    if (lower.includes("expert")) return 5;
  }
  return 3;
}

export const echoTrainingRouter = router;
