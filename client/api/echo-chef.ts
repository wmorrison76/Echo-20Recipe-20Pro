import type { Request, Response } from "express";
import { EchoChefBrain, type ChefBrainSuggestion } from "../echo/brain/echoChefBrain";

async function embedTextToVector(text: string): Promise<number[]> {
  throw new Error(
    "embedTextToVector is not implemented – plug in your embedding model (OpenAI, etc.) here."
  );
}

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

    const embedding = await embedTextToVector(userPrompt);

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
