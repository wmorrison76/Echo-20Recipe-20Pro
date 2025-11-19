import type { Request, Response } from "express";
import { EchoChefBrain, type ChefBrainSuggestion } from "../echo/brain/echoChefBrain";
import { generateEmbeddingForQuery } from "../server/lib/echo-chef-embedding";

/**
 * POST /api/echo-chef
 * Accepts user prompt + dietary/allergen filters
 * Returns Chef Brain suggestions (existing recipes, variations, new concepts)
 * Uses server-side vector engine for embedding (Pinecone/pgvector agnostic)
 */
export const echoChefHandler = async (req: Request, res: Response) => {
  try {
    const { userPrompt, dietaryTags, avoidAllergens, maxComplexity } = req.body as {
      userPrompt: string;
      dietaryTags?: string[];
      avoidAllergens?: string[];
      maxComplexity?: 1 | 2 | 3 | 4 | 5;
    };

    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({ error: "userPrompt is required" });
    }

    // Generate embedding using existing vector engine (Pinecone/pgvector)
    const embedding = await generateEmbeddingForQuery(userPrompt);

    // Get Chef Brain suggestions from imported recipe knowledge base
    const suggestions: ChefBrainSuggestion[] =
      await EchoChefBrain.suggestRecipes({
        userPrompt,
        queryEmbedding: embedding,
        dietaryTags,
        avoidAllergens,
        maxComplexity,
      });

    return res.json(suggestions);
  } catch (err: any) {
    console.error("[EchoChef] Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};
