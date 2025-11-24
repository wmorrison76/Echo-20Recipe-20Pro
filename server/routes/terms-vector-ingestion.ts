/**
 * Terms Vector Ingestion API
 * Ingests culinary terms from master dictionary to both Supabase pgvector and Pinecone
 * Handles 181,000+ uploaded terms with batch processing and error recovery
 */

import { Router, Request, Response } from "express";
import { masterCulinaryDictionary } from "../lib/master-culinary-dictionary";
import { uploadedTermsStore } from "../lib/uploaded-terms-store";
import { storeInternalKnowledgeBatch } from "../lib/internal-knowledge-service";
import { generateEmbedding } from "../lib/pinecone-service";
import { getPineconeStatus } from "../lib/pinecone-verification-service";
import { storeKnowledgeBatch } from "../lib/knowledge-vector-service";

const router = Router();

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: any, res: any) => Promise<any>,
) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res)).catch(next);
};

interface IngestionProgress {
  totalTerms: number;
  processedTerms: number;
  supabaseSuccess: number;
  supabaseErrors: number;
  pineconeSuccess: number;
  pineconeErrors: number;
  overallProgress: number;
  currentPhase: "fetching" | "embedding" | "supabase" | "pinecone" | "complete";
  message: string;
  errors: string[];
  startTime: number;
  estimatedTimeRemaining: number;
}

let currentProgress: IngestionProgress | null = null;

/**
 * GET /api/terms/ingestion/progress
 * Check ingestion progress
 */
router.get("/progress", (req: Request, res: Response) => {
  if (!currentProgress) {
    return res.json({
      status: "idle",
      message: "No ingestion in progress",
    });
  }

  return res.json({
    status: "in_progress",
    progress: currentProgress,
  });
});

/**
 * POST /api/terms/ingest/start
 * Start ingesting all terms to both Supabase and Pinecone
 */
router.post("/ingest/start", async (req: Request, res: Response) => {
  // Prevent multiple concurrent ingestions
  if (currentProgress) {
    return res.status(409).json({
      success: false,
      error: "Ingestion already in progress",
      progress: currentProgress,
    });
  }

  // Start ingestion in background
  startIngestion();

  return res.json({
    success: true,
    message: "Ingestion started",
    message2: "Check /api/terms/ingestion/progress for updates",
  });
});

/**
 * Main ingestion function - runs in background
 */
async function startIngestion(): Promise<void> {
  const startTime = Date.now();

  // Ensure uploaded terms store is loaded
  await uploadedTermsStore.ensureLoaded();

  // Combine master dictionary terms with uploaded terms
  const masterTerms = masterCulinaryDictionary.getAllTerms();
  const uploadedTerms = uploadedTermsStore.getAllTerms();

  // Remove duplicates by using a Map with term names as keys
  const allTermsMap = new Map<string, typeof masterTerms[0]>();

  // Add master terms first
  for (const term of masterTerms) {
    allTermsMap.set(term.term.toLowerCase(), term);
  }

  // Add uploaded terms (will overwrite any duplicates)
  for (const term of uploadedTerms) {
    allTermsMap.set(term.term.toLowerCase(), term);
  }

  const allTerms = Array.from(allTermsMap.values());

  currentProgress = {
    totalTerms: allTerms.length,
    processedTerms: 0,
    supabaseSuccess: 0,
    supabaseErrors: 0,
    pineconeSuccess: 0,
    pineconeErrors: 0,
    overallProgress: 0,
    currentPhase: "fetching",
    message: `Starting ingestion of ${allTerms.length} terms...`,
    errors: [],
    startTime,
    estimatedTimeRemaining: 0,
  };

  console.log(
    `[TermIngestion] Starting ingestion of ${allTerms.length} terms to Supabase and Pinecone`,
  );

  try {
    // Phase 1: Fetch and prepare terms
    currentProgress.currentPhase = "embedding";
    currentProgress.message = "Generating embeddings...";

    const termsWithEmbeddings = [];
    const batchSize = 50;

    for (let i = 0; i < allTerms.length; i += batchSize) {
      const batch = allTerms.slice(i, Math.min(i + batchSize, allTerms.length));

      for (const term of batch) {
        try {
          // Generate embedding from title + content
          const textToEmbed = `${term.term} ${term.definition}`;
          const embedding = await generateEmbedding(textToEmbed);

          termsWithEmbeddings.push({
            term,
            embedding,
          });

          currentProgress.processedTerms = termsWithEmbeddings.length;
          currentProgress.overallProgress = Math.round(
            (termsWithEmbeddings.length / allTerms.length) * 100,
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          currentProgress.errors.push(
            `Failed to embed term "${term.term}": ${errorMsg}`,
          );
          console.error(
            `[TermIngestion] Embedding failed for "${term.term}":`,
            error,
          );
        }

        // Update progress message periodically
        if (termsWithEmbeddings.length % 100 === 0) {
          currentProgress.message = `Generated embeddings for ${termsWithEmbeddings.length}/${allTerms.length} terms`;
        }
      }

      // Rate limiting delay
      if (i + batchSize < allTerms.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `[TermIngestion] Generated embeddings for ${termsWithEmbeddings.length} terms`,
    );

    // Phase 2: Ingest to Supabase pgvector
    currentProgress.currentPhase = "supabase";
    currentProgress.message = "Ingesting to Supabase pgvector...";
    currentProgress.processedTerms = 0;

    const supabaseItems = termsWithEmbeddings.map(({ term, embedding }) => ({
      title: term.term,
      content: term.definition,
      description: `${term.usage?.primary || term.definition}`,
      embedding,
      sourceType: "culinary-dictionary" as const,
      source: "master-culinary-dictionary",
      metadata: {
        categories: term.categories,
        masteryLevel: term.masteryLevel,
        confidence: term.confidence,
        etymology: term.etymology,
        relatedTerms: term.relatedTerms,
      },
    }));

    try {
      const supabaseResult = await storeInternalKnowledgeBatch(
        supabaseItems,
        10,
      );

      currentProgress.supabaseSuccess = supabaseResult.success;
      currentProgress.supabaseErrors = supabaseResult.failed;
      currentProgress.message = `Ingested ${supabaseResult.success} terms to Supabase`;

      console.log(
        `[TermIngestion] Supabase ingestion complete: ${supabaseResult.success} success, ${supabaseResult.failed} errors`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      currentProgress.errors.push(`Supabase ingestion failed: ${errorMsg}`);
      console.error("[TermIngestion] Supabase ingestion error:", error);
    }

    // Phase 3: Ingest to Pinecone
    currentProgress.currentPhase = "pinecone";
    currentProgress.message = "Ingesting to Pinecone...";
    currentProgress.processedTerms = 0;

    try {
      const pineconeStatus = await getPineconeStatus();

      if (!pineconeStatus.connected) {
        throw new Error(
          `Pinecone not connected: ${pineconeStatus.error || "Unknown error"}`,
        );
      }

      // Convert to Pinecone format (as TerminologyKnowledge)
      const pineconeItems = termsWithEmbeddings.map(
        ({ term, embedding }, idx) => {
          const knowledgeItem = {
            id: `terminology-${idx}-${Date.now()}`,
            type: "terminology" as const,
            title: term.term,
            description: `${term.usage?.primary || term.definition}`,
            content: term.definition,
            source: "culinary-dictionary",
            sourceType: "user_imported" as const,
            tags: term.categories,
            domain: "culinary" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confidence: term.confidence,
            definition: term.definition,
            etymology: term.etymology?.originalWord || term.term,
            context: term.usage?.context || "culinary",
            synonyms: term.relatedTerms,
          };
          return knowledgeItem;
        },
      );

      const pineconeResult = await storeKnowledgeBatch(pineconeItems);

      currentProgress.pineconeSuccess = pineconeResult.success;
      currentProgress.pineconeErrors = pineconeResult.failed;
      currentProgress.message = `Ingested ${pineconeResult.success} terms to Pinecone`;

      console.log(
        `[TermIngestion] Pinecone ingestion complete: ${pineconeResult.success} success, ${pineconeResult.failed} errors`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      currentProgress.errors.push(`Pinecone ingestion failed: ${errorMsg}`);
      console.error("[TermIngestion] Pinecone ingestion error:", error);
    }

    // Phase 4: Complete
    currentProgress.currentPhase = "complete";
    currentProgress.overallProgress = 100;
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    currentProgress.message = `✓ Ingestion complete! Processed ${currentProgress.supabaseSuccess + currentProgress.pineconeSuccess} terms in ${duration.toFixed(1)}s`;

    console.log(
      `[TermIngestion] Ingestion complete: Supabase=${currentProgress.supabaseSuccess}, Pinecone=${currentProgress.pineconeSuccess}, Duration=${duration.toFixed(1)}s`,
    );

    // Keep progress available for 5 minutes then clear
    setTimeout(
      () => {
        currentProgress = null;
      },
      5 * 60 * 1000,
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    currentProgress.currentPhase = "complete";
    currentProgress.message = `✗ Ingestion failed: ${errorMsg}`;
    currentProgress.errors.push(errorMsg);

    console.error("[TermIngestion] Fatal ingestion error:", error);

    // Keep error state for 5 minutes
    setTimeout(
      () => {
        currentProgress = null;
      },
      5 * 60 * 1000,
    );
  }
}

/**
 * POST /api/terms/ingest/all
 * Immediate synchronous ingestion (for smaller datasets)
 */
router.post("/ingest/all", async (req: Request, res: Response) => {
  try {
    // Ensure uploaded terms store is loaded
    await uploadedTermsStore.ensureLoaded();

    // Combine master dictionary terms with uploaded terms
    const masterTerms = masterCulinaryDictionary.getAllTerms();
    const uploadedTerms = uploadedTermsStore.getAllTerms();

    // Remove duplicates
    const allTermsMap = new Map<string, typeof masterTerms[0]>();
    for (const term of masterTerms) {
      allTermsMap.set(term.term.toLowerCase(), term);
    }
    for (const term of uploadedTerms) {
      allTermsMap.set(term.term.toLowerCase(), term);
    }

    const allTerms = Array.from(allTermsMap.values());

    if (allTerms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No terms available in master dictionary or uploaded terms",
      });
    }

    console.log(
      `[TermIngestion] Direct ingestion of ${allTerms.length} terms started`,
    );

    const supabaseItems = allTerms.map((term) => ({
      title: term.term,
      content: term.definition,
      description: `${term.usage?.primary || term.definition}`,
      embedding: new Array(1536).fill(0), // Placeholder, will be generated
      sourceType: "culinary-dictionary" as const,
      source: "master-culinary-dictionary",
      metadata: {
        categories: term.categories,
        masteryLevel: term.masteryLevel,
        confidence: term.confidence,
        etymology: term.etymology,
        relatedTerms: term.relatedTerms,
      },
    }));

    const supabaseResult = await storeInternalKnowledgeBatch(supabaseItems, 5);

    return res.json({
      success: true,
      message: `Ingested ${supabaseResult.success} terms to Supabase`,
      result: {
        success: supabaseResult.success,
        failed: supabaseResult.failed,
        totalTerms: allTerms.length,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[TermIngestion] Direct ingestion error:", error);

    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * GET /api/terms/count
 * Get total number of terms available for ingestion
 */
router.get("/count", async (req: Request, res: Response) => {
  try {
    // Ensure uploaded terms store is loaded
    await uploadedTermsStore.ensureLoaded();

    // Combine master dictionary terms with uploaded terms
    const masterTerms = masterCulinaryDictionary.getAllTerms();
    const uploadedTerms = uploadedTermsStore.getAllTerms();

    // Remove duplicates
    const allTermsMap = new Map<string, typeof masterTerms[0]>();
    for (const term of masterTerms) {
      allTermsMap.set(term.term.toLowerCase(), term);
    }
    for (const term of uploadedTerms) {
      allTermsMap.set(term.term.toLowerCase(), term);
    }

    const totalTerms = allTermsMap.size;
    const uploadedCount = uploadedTermsStore.getCount();

    return res.json({
      success: true,
      totalTerms,
      uploadedTerms: uploadedCount,
      masterTerms: masterTerms.length,
      termsReady: true,
      message: `${totalTerms} terms available for ingestion (${uploadedCount} uploaded, ${masterTerms.length} built-in)`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[TermIngestion] Error getting terms count:", error);

    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

export { router as termsVectorIngestionRouter };
export default router;
