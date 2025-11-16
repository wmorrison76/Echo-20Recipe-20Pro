import { Router, Request, Response } from "express";
import { generateEmbedding } from "../lib/vector-engine";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

const router = Router();

/**
 * POST /api/procedures/store
 * Store a culinary procedure with semantic embedding
 */
router.post("/store", async (req: Request, res: Response) => {
  try {
    const {
      title,
      source_book,
      category,
      steps,
      materials,
      tools,
      time_estimate,
      difficulty,
      related_keywords,
    } = req.body;

    if (!title || !category || !steps) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, category, steps",
      });
    }

    // Generate embedding from procedure text
    const procedureText = `${title} ${steps.map((s: any) => s.instruction).join(" ")}`;
    const embedding = await generateEmbedding(procedureText);

    // Store in Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("culinary_procedures")
      .insert([
        {
          title,
          source_book: source_book || "unknown",
          category,
          steps,
          materials: materials || [],
          tools: tools || [],
          time_estimate,
          difficulty,
          related_keywords: related_keywords || [],
          embedding,
        },
      ])
      .select();

    if (error) {
      console.error("Error storing procedure:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error("Error in /procedures/store:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/procedures/search
 * Search procedures semantically
 */
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { query, limit = 10, category, min_similarity = 0.3 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: query",
      });
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Call the search function
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("search_culinary_procedures", {
      query_embedding: queryEmbedding,
      p_limit: limit,
      p_category: category,
      p_min_similarity: min_similarity,
    });

    if (error) {
      console.error("Error searching procedures:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Add relevance score to results
    const results = (data || []).map((proc: any) => ({
      procedure: {
        id: proc.id,
        title: proc.title,
        source_book: proc.source_book,
        category: proc.category,
        steps: proc.steps,
        materials: proc.materials,
        tools: proc.tools,
        time_estimate: proc.time_estimate,
        difficulty: proc.difficulty,
        related_keywords: proc.related_keywords,
      },
      relevance_score: proc.similarity || 0,
    }));

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in /procedures/search:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/procedures/by-category/:category
 * Get all procedures for a specific category
 */
router.get("/by-category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase.rpc("get_procedures_by_category", {
      p_category: category,
      p_limit: parseInt(limit as string) || 20,
    });

    if (error) {
      console.error("Error fetching procedures by category:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in /procedures/by-category:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/procedures/by-book/:book
 * Get all procedures from a specific book
 */
router.get("/by-book/:book", async (req: Request, res: Response) => {
  try {
    const { book } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase.rpc("get_procedures_by_book", {
      p_book: decodeURIComponent(book),
      p_limit: parseInt(limit as string) || 50,
    });

    if (error) {
      console.error("Error fetching procedures by book:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in /procedures/by-book:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/procedures/search-text/:query
 * Full text search on procedures
 */
router.get("/search-text/:query", async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase.rpc("search_procedures_fulltext", {
      p_query: decodeURIComponent(query),
      p_limit: parseInt(limit as string) || 20,
    });

    if (error) {
      console.error("Error searching procedures by text:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in /procedures/search-text:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/procedures/all
 * Get all procedures (paginated)
 */
router.get("/all", async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from("culinary_procedures")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string) || 0,
        (parseInt(offset as string) || 0) + (parseInt(limit as string) || 100) - 1
      );

    if (error) {
      console.error("Error fetching procedures:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
      total: count,
      limit: parseInt(limit as string) || 100,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    console.error("Error in /procedures/all:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/procedures/:id
 * Get a specific procedure by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("culinary_procedures")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching procedure:", error);
      return res.status(404).json({
        success: false,
        error: "Procedure not found",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in /procedures/:id:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /api/procedures/:id
 * Delete a procedure
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("culinary_procedures")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting procedure:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Procedure deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /procedures/:id:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
