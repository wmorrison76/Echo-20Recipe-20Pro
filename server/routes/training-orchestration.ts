/**
 * Training Orchestration API
 * Central endpoint for starting, monitoring, and controlling all training activities
 */

import { Router, Request, Response } from "express";
import {
  trainingOrchestrator,
  type TrainingMode,
  type TrainingSource,
} from "../lib/training-orchestrator";
import { ingestionController } from "../lib/knowledge-ingestion-service";
import { countPineconeVectors } from "../lib/pinecone-extraction-service";
import { webRecipeCrawler } from "../lib/web-recipe-crawler";
import { handlePDFUpload } from "../lib/pdf-upload-handler";
import { uploadedTermsStore } from "../lib/uploaded-terms-store";
import { masterCulinaryDictionary } from "../lib/master-culinary-dictionary";

const router = Router();

// Helper to wrap async route handlers and catch errors
const asyncHandler =
  (fn: (req: any, res: any) => Promise<any>) =>
  (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/**
 * POST /api/training/session/initialize
 * Create a new training session
 */
router.post(
  "/session/initialize",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { mode = "sequential" } = req.body as { mode?: TrainingMode };

      const session = trainingOrchestrator.initializeSession(mode);

      return res.json({
        success: true,
        session,
        message: `Training session initialized in ${mode} mode`,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to initialize training session",
      });
    }
  }),
);

/**
 * GET /api/training/session/status
 * Get current training session status
 */
router.get(
  "/session/status",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const session = trainingOrchestrator.getSession();

      if (!session) {
        return res.json({
          success: true,
          session: null,
          message: "No active training session",
        });
      }

      return res.json({
        success: true,
        session,
        summary: trainingOrchestrator.getSummary(),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get training session status",
      });
    }
  }),
);

/**
 * POST /api/training/start
 * Start training with specified sources and mode
 */
router.post(
  "/start",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if training is already running
      if (trainingOrchestrator.isSessionActive()) {
        return res.status(409).json({
          success: false,
          error:
            "Training is already in progress. Please wait for it to complete.",
        });
      }

      const {
        mode = "sequential",
        sources = [
          "master-dictionary",
          "pinecone-migration",
          "pdf-library",
          "web-crawler",
        ],
      } = req.body as {
        mode?: TrainingMode;
        sources?: TrainingSource[];
      };

      // Initialize session
      const session = trainingOrchestrator.initializeSession(mode);

      // Define handlers for each source
      const handlers: Record<TrainingSource, () => Promise<void>> = {
        async "master-dictionary"() {
          try {
            console.log("[Training] Starting Master Dictionary ingestion...");
            trainingOrchestrator.startSource("master-dictionary");
            trainingOrchestrator.updateSourceProgress("master-dictionary", {
              message: "Loading Master Dictionary terms...",
              progress: 10,
            });

            const result = await ingestionController.ingestMasterDictionary();
            trainingOrchestrator.completeSource(
              "master-dictionary",
              result.totalIngested,
              result.totalFailed,
            );
          } catch (error) {
            console.error("[Training] Master Dictionary error:", error);
            trainingOrchestrator.failSource(
              "master-dictionary",
              error instanceof Error ? error.message : String(error),
            );
          }
        },

        async "pinecone-migration"() {
          try {
            console.log("[Training] Starting Pinecone migration...");
            trainingOrchestrator.startSource("pinecone-migration");
            trainingOrchestrator.updateSourceProgress("pinecone-migration", {
              message: "Connecting to Pinecone and extracting data...",
              progress: 10,
            });

            const result = await ingestionController.ingestFromPinecone();
            trainingOrchestrator.completeSource(
              "pinecone-migration",
              result.totalIngested,
              result.totalFailed,
            );
          } catch (error) {
            console.error("[Training] Pinecone migration error:", error);
            trainingOrchestrator.failSource(
              "pinecone-migration",
              error instanceof Error ? error.message : String(error),
            );
          }
        },

        async "pdf-library"() {
          try {
            console.log("[Training] Starting PDF library ingestion...");
            // This would be triggered when users upload PDFs
            // For now, just mark as pending
            trainingOrchestrator.updateSourceProgress("pdf-library", {
              status: "pending",
              message: "Waiting for PDF uploads",
              progress: 0,
            });
          } catch (error) {
            trainingOrchestrator.failSource(
              "pdf-library",
              error instanceof Error ? error.message : String(error),
            );
          }
        },

        async "web-crawler"() {
          try {
            console.log("[Training] Starting web crawler...");
            // This would trigger the crawler service
            // For now, just mark as pending
            trainingOrchestrator.updateSourceProgress("web-crawler", {
              status: "pending",
              message: "Crawler module pending implementation",
              progress: 0,
            });
          } catch (error) {
            trainingOrchestrator.failSource(
              "web-crawler",
              error instanceof Error ? error.message : String(error),
            );
          }
        },

        async "recipe-imports"() {
          try {
            console.log("[Training] Waiting for recipe imports...");
            // This is user-driven, so just acknowledge
            trainingOrchestrator.updateSourceProgress("recipe-imports", {
              status: "pending",
              message: "Ready to accept recipe imports",
              progress: 0,
            });
          } catch (error) {
            trainingOrchestrator.failSource(
              "recipe-imports",
              error instanceof Error ? error.message : String(error),
            );
          }
        },
      };

      // Start training in background
      const trainingSources = sources.filter((s) => s in handlers);

      if (mode === "sequential") {
        trainingOrchestrator
          .runSequential(trainingSources, handlers)
          .then(() => {
            console.log("[Training] Sequential training completed");
          })
          .catch((error) => {
            console.error("[Training] Sequential training failed:", error);
          });
      } else {
        trainingOrchestrator
          .runParallel(trainingSources, handlers)
          .then(() => {
            console.log("[Training] Parallel training completed");
          })
          .catch((error) => {
            console.error("[Training] Parallel training failed:", error);
          });
      }

      return res.json({
        success: true,
        session,
        message: `Training started in ${mode} mode with ${trainingSources.length} sources`,
        trainingSources: trainingSources,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to start training",
      });
    }
  }),
);

/**
 * POST /api/training/ingest-recipe
 * Ingest recipes into the knowledge base
 */
router.post("/ingest-recipe", async (req: Request, res: Response) => {
  try {
    const { recipes, recipeCount = 0 } = req.body as {
      recipes?: any[];
      recipeCount?: number;
    };

    const session = trainingOrchestrator.getSession();
    if (session) {
      trainingOrchestrator.updateSourceProgress("recipe-imports", {
        status: "running",
        message: `Ingesting ${recipeCount} recipes...`,
        progress: 50,
        totalItems: recipeCount,
      });
    }

    // Simulate ingestion (would be actual storage)
    setTimeout(() => {
      if (session) {
        trainingOrchestrator.completeSource("recipe-imports", recipeCount, 0);
      }
    }, 1000);

    return res.json({
      success: true,
      message: `Ingested ${recipeCount} recipes`,
      recipesAdded: recipeCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to ingest recipes",
    });
  }
});

/**
 * POST /api/training/ingest-pdf
 * Ingest PDFs into the knowledge base
 */
router.post("/ingest-pdf", async (req: Request, res: Response) => {
  try {
    const { pdfCount = 0, documentCount = 0 } = req.body as {
      pdfCount?: number;
      documentCount?: number;
    };

    const session = trainingOrchestrator.getSession();
    if (session) {
      trainingOrchestrator.updateSourceProgress("pdf-library", {
        status: "running",
        message: `Processing ${pdfCount} PDF(s)...`,
        progress: 50,
        totalItems: documentCount,
      });
    }

    // Simulate ingestion
    setTimeout(() => {
      if (session) {
        trainingOrchestrator.completeSource("pdf-library", documentCount, 0);
      }
    }, 2000);

    return res.json({
      success: true,
      message: `Processed ${pdfCount} PDF(s), extracted ${documentCount} documents`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to ingest PDFs",
    });
  }
});

/**
 * GET /api/training/summary
 * Get training summary and statistics
 */
router.get("/summary", (req: Request, res: Response) => {
  try {
    const summary = trainingOrchestrator.getSummary();

    if (!summary) {
      return res.json({
        success: true,
        summary: null,
        message: "No training session to summarize",
      });
    }

    return res.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get training summary",
    });
  }
});

export default router;
