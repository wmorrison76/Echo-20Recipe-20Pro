import { Router, Request, Response } from "express";
import {
  designExperiment,
  validateExperimentResults,
  generateSOP,
  getExperimentRecommendations,
} from "../lib/ai-llm-service";
import { validateExperimentalResults, estimateTimeline, calculateCostImpact } from "../lib/ai-stats-validation";

const router = Router();

/**
 * POST /api/rdlabs/ai/design
 * Design a new experiment based on research goal
 */
router.post("/design", async (req: Request, res: Response) => {
  try {
    const { goal, constraints, context } = req.body;

    if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_GOAL",
          message: "Goal is required and must be a non-empty string",
        },
      });
    }

    const design = await designExperiment({
      goal: goal.trim(),
      constraints,
      context,
    });

    return res.json({
      success: true,
      data: design,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /design:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "DESIGN_ERROR",
        message: error instanceof Error ? error.message : "Failed to design experiment",
      },
    });
  }
});

/**
 * POST /api/rdlabs/ai/validate
 * Validate experimental results
 */
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { results, baseline, notes, experimentTitle } = req.body;

    if (!Array.isArray(results) || !Array.isArray(baseline)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DATA",
          message: "Results and baseline must be arrays of numbers",
        },
      });
    }

    if (results.length < 3 || baseline.length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_DATA",
          message: "Minimum 3 samples required for both results and baseline",
        },
      });
    }

    // Get AI validation
    const aiValidation = await validateExperimentResults({
      results,
      baseline,
      notes,
      experimentTitle,
    });

    // Get statistical validation
    const statsValidation = validateExperimentalResults(results, baseline);

    return res.json({
      success: true,
      data: {
        ...aiValidation,
        statistics: statsValidation,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /validate:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Failed to validate results",
      },
    });
  }
});

/**
 * POST /api/rdlabs/ai/sop
 * Generate Standard Operating Procedure
 */
router.post("/sop", async (req: Request, res: Response) => {
  try {
    const { title, hypothesis, variables, procedure, ingredients, equipment, successCriteria } = req.body;

    if (!title || !hypothesis || !procedure || !ingredients) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "title, hypothesis, procedure, and ingredients are required",
        },
      });
    }

    const sop = await generateSOP({
      title,
      hypothesis,
      variables: variables || [],
      procedure,
      ingredients,
      equipment: equipment || [],
      successCriteria: successCriteria || [],
    });

    return res.json({
      success: true,
      data: sop,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /sop:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SOP_ERROR",
        message: error instanceof Error ? error.message : "Failed to generate SOP",
      },
    });
  }
});

/**
 * GET /api/rdlabs/ai/recommendations
 * Get recommendations for similar experiments
 */
router.get("/recommendations", async (req: Request, res: Response) => {
  try {
    const { goal, recentExperiments } = req.query;

    if (!goal) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_GOAL",
          message: "goal query parameter is required",
        },
      });
    }

    const experiments = Array.isArray(recentExperiments) ? recentExperiments : [];

    const recommendations = await getExperimentRecommendations(
      goal as string,
      experiments as string[]
    );

    return res.json({
      success: true,
      data: {
        goal,
        recommendations,
        count: recommendations.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /recommendations:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "RECOMMENDATIONS_ERROR",
        message: error instanceof Error ? error.message : "Failed to get recommendations",
      },
    });
  }
});

/**
 * POST /api/rdlabs/ai/timeline
 * Estimate timeline based on similar experiments
 */
router.post("/timeline", async (req: Request, res: Response) => {
  try {
    const { similarExperiments } = req.body;

    if (!Array.isArray(similarExperiments)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DATA",
          message: "similarExperiments must be an array",
        },
      });
    }

    const timeline = estimateTimeline(similarExperiments);

    return res.json({
      success: true,
      data: timeline,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /timeline:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "TIMELINE_ERROR",
        message: error instanceof Error ? error.message : "Failed to estimate timeline",
      },
    });
  }
});

/**
 * POST /api/rdlabs/ai/cost-analysis
 * Analyze cost impact and volatility
 */
router.post("/cost-analysis", async (req: Request, res: Response) => {
  try {
    const { ingredients, batchSize } = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DATA",
          message: "ingredients must be an array",
        },
      });
    }

    const costAnalysis = calculateCostImpact(ingredients, batchSize || 100);

    return res.json({
      success: true,
      data: costAnalysis,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "N/A",
      },
    });
  } catch (error) {
    console.error("Error in /cost-analysis:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "COST_ERROR",
        message: error instanceof Error ? error.message : "Failed to analyze costs",
      },
    });
  }
});

/**
 * GET /api/rdlabs/ai/health
 * Health check for AI services
 */
router.get("/health", (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      status: "healthy",
      services: {
        llm: "claude-3-5-sonnet",
        stats: "enabled",
        version: "1.0",
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
