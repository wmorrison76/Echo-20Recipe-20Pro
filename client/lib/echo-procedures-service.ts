import { generateEmbedding } from "./pinecone-client";

export interface CulinaryProcedure {
  id: string;
  title: string;
  source_book: string;
  category: "butchery" | "pastry" | "cooking" | "preparation" | "technique" | "general";
  steps: Array<{
    number: number;
    instruction: string;
    tips?: string;
  }>;
  materials?: string[];
  tools?: string[];
  time_estimate?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  related_keywords?: string[];
  created_at: number;
  embedding?: number[];
}

export interface ProcedureSearchResult {
  procedure: CulinaryProcedure;
  relevance_score: number;
}

/**
 * Generate semantic embedding for a procedure using OpenAI
 */
async function generateProcedureEmbedding(
  procedureText: string,
): Promise<number[]> {
  try {
    const embedding = await generateEmbedding(procedureText);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Store culinary procedures in localStorage (persists across sessions)
 * In production, this would be stored in Pinecone via backend
 */
export async function storeProcedure(
  procedure: Omit<CulinaryProcedure, "id" | "created_at" | "embedding">,
): Promise<CulinaryProcedure> {
  const id = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate embedding for semantic search
  const procedureText = `${procedure.title} ${procedure.steps.map((s) => s.instruction).join(" ")}`;
  const embedding = await generateProcedureEmbedding(procedureText);

  const fullProcedure: CulinaryProcedure = {
    ...procedure,
    id,
    created_at: Date.now(),
    embedding,
  };

  // Store in localStorage
  const existing = getAllProcedures();
  existing.push(fullProcedure);
  localStorage.setItem("procedures:culinary", JSON.stringify(existing));

  return fullProcedure;
}

/**
 * Search procedures semantically
 */
export async function searchProcedures(
  query: string,
  limit: number = 5,
): Promise<ProcedureSearchResult[]> {
  try {
    // Get embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get all procedures
    const procedures = getAllProcedures();

    // Calculate similarity scores using cosine similarity
    const results = procedures
      .map((proc) => {
        const embedding = proc.embedding || [];
        const score = cosineSimilarity(queryEmbedding, embedding);
        return { procedure: proc, relevance_score: score };
      })
      .filter((r) => r.relevance_score > 0.3) // Filter by relevance threshold
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("Error searching procedures:", error);
    return [];
  }
}

/**
 * Get all stored procedures
 */
export function getAllProcedures(): CulinaryProcedure[] {
  try {
    const raw = localStorage.getItem("procedures:culinary") || "[]";
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Get procedure by ID
 */
export function getProcedureById(id: string): CulinaryProcedure | null {
  const procedures = getAllProcedures();
  return procedures.find((p) => p.id === id) || null;
}

/**
 * Get procedures by category
 */
export function getProceduresByCategory(
  category: CulinaryProcedure["category"],
): CulinaryProcedure[] {
  const procedures = getAllProcedures();
  return procedures.filter((p) => p.category === category);
}

/**
 * Get procedures from a specific book
 */
export function getProceduresByBook(bookName: string): CulinaryProcedure[] {
  const procedures = getAllProcedures();
  return procedures.filter((p) => p.source_book.toLowerCase() === bookName.toLowerCase());
}

/**
 * Delete a procedure
 */
export function deleteProcedure(id: string): boolean {
  const existing = getAllProcedures();
  const filtered = existing.filter((p) => p.id !== id);
  if (filtered.length < existing.length) {
    localStorage.setItem("procedures:culinary", JSON.stringify(filtered));
    return true;
  }
  return false;
}

/**
 * Clear all procedures (destructive - use with caution)
 */
export function clearAllProcedures(): void {
  localStorage.removeItem("procedures:culinary");
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
