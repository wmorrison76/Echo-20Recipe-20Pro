import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX = "echo-recipes";

export type RecipeTrack = "fine-dining" | "manufacturing";

export interface RecipeVector {
  id: string;
  recipeId: string;
  title: string;
  track: RecipeTrack;
  chefId: string;
  organizationId: string;
  vector: number[];
  metadata: {
    title: string;
    cuisine?: string;
    course?: string;
    prepTime?: number;
    cookTime?: number;
    difficulty?: string;
    ingredients?: string[];
    tags?: string[];
    collaborators?: string[];
    crossTrackViable?: boolean;
    createdAt: string;
  };
}

export interface RecipeSimilarityMatch {
  id: string;
  recipeId: string;
  title: string;
  track: RecipeTrack;
  score: number;
  metadata: any;
}

interface EmbeddingRequest {
  input: string;
  model: string;
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient && PINECONE_API_KEY) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }
  return pineconeClient!;
}

/**
 * Generate embeddings using OpenAI API (simulated for Pinecone compatibility)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY || process.env.ECHO_OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn("OpenAI API key not found, using mock embedding");
    return generateMockEmbedding(text);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as EmbeddingResponse;
    return data.data[0]?.embedding || generateMockEmbedding(text);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return generateMockEmbedding(text);
  }
}

/**
 * Generate a simple mock embedding for testing
 */
function generateMockEmbedding(text: string): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    let hash = 0;
    const str = text + i;
    for (let j = 0; j < str.length; j++) {
      const char = str.charCodeAt(j);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    embedding.push((hash % 1000) / 1000);
  }
  return embedding;
}

/**
 * Store a recipe vector in Pinecone with track metadata
 */
export async function storeRecipeVector(
  recipe: {
    id: string;
    title: string;
    description?: string;
    ingredients?: string[];
    cuisine?: string;
    course?: string;
    prepTime?: number;
    cookTime?: number;
    difficulty?: string;
    tags?: string[];
  },
  track: RecipeTrack,
  chefId: string,
  organizationId: string,
  collaborators?: string[]
): Promise<void> {
  if (!PINECONE_API_KEY) {
    console.warn("Pinecone API key not configured, skipping vector storage");
    return;
  }

  try {
    const client = getPineconeClient();
    const index = client.Index(PINECONE_INDEX);

    const recipeText = [
      recipe.title,
      recipe.description || "",
      recipe.ingredients?.join(" ") || "",
      recipe.cuisine || "",
      recipe.course || "",
      recipe.tags?.join(" ") || "",
    ]
      .filter(Boolean)
      .join(" ");

    const embedding = await generateEmbedding(recipeText);

    const vectorId = `${track}-${recipe.id}-${chefId}`;
    const metadata = {
      title: recipe.title,
      cuisine: recipe.cuisine,
      course: recipe.course,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      tags: recipe.tags,
      collaborators: collaborators,
      crossTrackViable: isCrossTrackViable(recipe),
      createdAt: new Date().toISOString(),
      track,
      chefId,
      organizationId,
      recipeId: recipe.id,
    };

    await index.upsert([
      {
        id: vectorId,
        values: embedding,
        metadata,
      },
    ]);
  } catch (error) {
    console.error("Error storing recipe vector:", error);
    throw error;
  }
}

/**
 * Determine if a recipe can be useful in both tracks
 * Fine dining chefs can learn from manufacturing recipes about consistency
 */
function isCrossTrackViable(recipe: {
  difficulty?: string;
  tags?: string[];
  cuisine?: string;
}): boolean {
  const techniqueTags = recipe.tags || [];
  const crossTrackTechniques = [
    "precision",
    "consistency",
    "scaling",
    "technique",
    "method",
  ];
  return techniqueTags.some((tag) =>
    crossTrackTechniques.some((tech) =>
      tag.toLowerCase().includes(tech.toLowerCase())
    )
  );
}

/**
 * Search for similar recipes with cross-track support
 */
export async function searchSimilarRecipes(
  recipeText: string,
  userTrack: RecipeTrack,
  chefId: string,
  organizationId: string,
  limit: number = 10,
  includeCrossTrack: boolean = true
): Promise<RecipeSimilarityMatch[]> {
  if (!PINECONE_API_KEY) {
    console.warn("Pinecone API key not configured, returning empty results");
    return [];
  }

  try {
    const client = getPineconeClient();
    const index = client.Index(PINECONE_INDEX);

    const embedding = await generateEmbedding(recipeText);

    const filterCriteria: Record<string, any> = {
      organizationId: { $eq: organizationId },
    };

    const results = await index.query({
      vector: embedding,
      topK: limit * 2,
      includeMetadata: true,
      filter: filterCriteria,
    });

    const matches: RecipeSimilarityMatch[] = results.matches
      .filter((match) => {
        const metadata = match.metadata as any;
        if (!metadata) return false;

        if (metadata.track === userTrack) {
          return true;
        }

        if (includeCrossTrack && metadata.track !== userTrack) {
          return metadata.crossTrackViable === true;
        }

        return false;
      })
      .slice(0, limit)
      .map((match) => ({
        id: match.id,
        recipeId: match.metadata?.recipeId || match.id,
        title: match.metadata?.title || "Unknown Recipe",
        track: match.metadata?.track || userTrack,
        score: match.score || 0,
        metadata: match.metadata,
      }));

    return matches;
  } catch (error) {
    console.error("Error searching similar recipes:", error);
    return [];
  }
}

/**
 * Get recipes by track with cross-track learning for manufacturing
 */
export async function getRecipesByTrack(
  track: RecipeTrack,
  organizationId: string,
  limit: number = 50
): Promise<RecipeSimilarityMatch[]> {
  if (!PINECONE_API_KEY) {
    console.warn("Pinecone API key not configured, returning empty results");
    return [];
  }

  try {
    const client = getPineconeClient();
    const index = client.Index(PINECONE_INDEX);

    const filterCriteria: Record<string, any> = {
      organizationId: { $eq: organizationId },
      track: { $eq: track },
    };

    const results = await index.query({
      vector: new Array(1536).fill(0),
      topK: limit,
      includeMetadata: true,
      filter: filterCriteria,
    });

    return results.matches.map((match) => ({
      id: match.id,
      recipeId: match.metadata?.recipeId || match.id,
      title: match.metadata?.title || "Unknown Recipe",
      track: match.metadata?.track || track,
      score: match.score || 0,
      metadata: match.metadata,
    }));
  } catch (error) {
    console.error("Error getting recipes by track:", error);
    return [];
  }
}

/**
 * Delete a recipe vector
 */
export async function deleteRecipeVector(
  recipeId: string,
  track: RecipeTrack,
  chefId: string
): Promise<void> {
  if (!PINECONE_API_KEY) {
    return;
  }

  try {
    const client = getPineconeClient();
    const index = client.Index(PINECONE_INDEX);
    const vectorId = `${track}-${recipeId}-${chefId}`;

    await index.deleteOne(vectorId);
  } catch (error) {
    console.error("Error deleting recipe vector:", error);
  }
}

/**
 * Get cross-track learning suggestions for manufacturing
 */
export async function getCrossTrackLearning(
  recipeText: string,
  organizationId: string,
  limit: number = 5
): Promise<RecipeSimilarityMatch[]> {
  if (!PINECONE_API_KEY) {
    return [];
  }

  try {
    const client = getPineconeClient();
    const index = client.Index(PINECONE_INDEX);

    const embedding = await generateEmbedding(recipeText);

    const filterCriteria: Record<string, any> = {
      organizationId: { $eq: organizationId },
      track: { $eq: "fine-dining" },
      crossTrackViable: { $eq: true },
    };

    const results = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: filterCriteria,
    });

    return results.matches.map((match) => ({
      id: match.id,
      recipeId: match.metadata?.recipeId || match.id,
      title: match.metadata?.title || "Unknown Recipe",
      track: "fine-dining",
      score: match.score || 0,
      metadata: match.metadata,
    }));
  } catch (error) {
    console.error("Error getting cross-track learning:", error);
    return [];
  }
}
