import { Router, type Request, type Response } from "express";
import { masterCulinaryDictionary } from "../lib/master-culinary-dictionary";
import { masterFinancialDictionary } from "../lib/master-financial-dictionary";

const router = Router();

/**
 * GET /api/knowledge/upload-test
 * Test endpoint to verify route is registered
 */
router.get("/upload-test", (req: Request, res: Response) => {
  console.log("[Term Uploader] Test endpoint hit");
  return res.status(200).json({ success: true, message: "Upload endpoint is working" });
});

interface UploadTermData {
  term: string;
  pronunciation?: string;
  etymology?: string;
  definition: string;
}

interface UploadRequest {
  terms: UploadTermData[];
  region: string;
}

// Map regions to category tags
const REGION_CATEGORIES: Record<string, string> = {
  chinese: "chinese",
  japanese: "japanese",
  thai: "thai",
  korean: "korean",
  indian: "indian",
  vietnamese: "vietnamese",
  french: "french",
  italian: "italian",
  spanish: "spanish",
  german: "german",
  mexican: "mexican",
  brazilian: "brazilian",
  american: "american",
  "middle-eastern": "middle-eastern",
  african: "african",
  oceanic: "oceanic",
};

/**
 * POST /api/knowledge/upload-terms
 * Upload culinary terms from JSON file
 */
router.post("/upload-terms", async (req: Request, res: Response) => {
  console.log("[Term Uploader] POST /api/knowledge/upload-terms hit", {
    method: req.method,
    headers: Object.keys(req.headers),
    bodyKeys: Object.keys(req.body),
    region: (req.body as any)?.region,
    termsLength: Array.isArray((req.body as any)?.terms) ? (req.body as any).terms.length : "not array"
  });

  try {
    const { terms, region } = req.body as UploadRequest;

    console.log("[Term Uploader] Processing:", {
      region,
      termsLength: terms?.length,
      bodySize: JSON.stringify(req.body).length,
    });

    // Validate input
    if (!Array.isArray(terms) || terms.length === 0) {
      console.log("[Term Uploader] Invalid terms array");
      return res.status(400).json({
        success: false,
        error: "Terms must be a non-empty array",
      });
    }

    if (!region || !REGION_CATEGORIES[region]) {
      console.log("[Term Uploader] Invalid region:", region);
      return res.status(400).json({
        success: false,
        error: `Invalid region. Must be one of: ${Object.keys(REGION_CATEGORIES).join(", ")}`,
      });
    }

    let uploadedCount = 0;
    const errors: Array<{ index: number; term: string; error: string }> = [];

    // Process each term
    for (let i = 0; i < terms.length; i++) {
      const termData = terms[i];

      try {
        // Validate required fields
        if (!termData.term || !termData.definition) {
          errors.push({
            index: i,
            term: termData.term || "Unknown",
            error: "Missing required fields: term, definition",
          });
          continue;
        }

        // Create standardized term object
        const standardizedTerm = {
          term: termData.term.trim(),
          definition: termData.definition.trim(),
          pronunciation: termData.pronunciation?.trim() || "",
          etymology: {
            origin: region.charAt(0).toUpperCase() + region.slice(1),
            originalWord: termData.etymology?.trim() || termData.term,
            meaning: termData.definition.substring(0, 50),
            period: `${region} culinary tradition`,
          },
          usage: {
            primary: termData.definition.substring(0, 80),
            secondary: [],
            context: `${region} cuisine`,
          },
          categories: [region, "cuisine"],
          applications: {
            primary: `Used in ${region} cooking`,
            examples: [],
            contexts: [`${region} cuisine`],
          },
          relatedTerms: [],
          history: {
            period: `Traditional ${region}`,
            culture: region,
            significance: `Traditional ${region} culinary term`,
          },
          confidence: 0.85,
          sources: [`User upload - ${new Date().toISOString().split("T")[0]}`],
          masteryLevel: "intermediate" as const,
        };

        // Add to master culinary dictionary
        const keyName = termData.term
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        masterCulinaryDictionary.addTerm(keyName, standardizedTerm);

        uploadedCount++;
      } catch (error) {
        errors.push({
          index: i,
          term: termData.term || "Unknown",
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred",
        });
      }
    }

    // Log summary
    console.log(
      `[Term Uploader] Completed processing: ${uploadedCount}/${terms.length} terms uploaded to ${region} region`
    );
    if (errors.length > 0) {
      console.log(
        `[Term Uploader] Encountered ${errors.length} errors during upload`
      );
      if (errors.length <= 10) {
        console.log(`[Term Uploader] Errors:`, errors);
      } else {
        console.log(`[Term Uploader] First 5 errors:`, errors.slice(0, 5));
      }
    }

    const responseData = {
      success: true,
      uploadedCount,
      totalCount: terms.length,
      region,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedCount} of ${terms.length} terms to ${region}`,
    };

    console.log("[Term Uploader] Sending response:", responseData);

    // Return response
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("[Term Uploader] Error:", error);
    const errorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during upload",
    };
    console.error("[Term Uploader] Sending error response:", errorResponse);
    return res.status(500).json(errorResponse);
  }
});

/**
 * POST /api/knowledge/upload-financial-terms
 * Upload financial terms from JSON file
 */
router.post("/upload-financial-terms", async (req: Request, res: Response) => {
  try {
    const { terms } = req.body as { terms: UploadTermData[] };

    // Validate input
    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Terms must be a non-empty array",
      });
    }

    let uploadedCount = 0;
    const errors: Array<{ index: number; term: string; error: string }> = [];

    // Process each term
    for (let i = 0; i < terms.length; i++) {
      const termData = terms[i];

      try {
        // Validate required fields
        if (!termData.term || !termData.definition) {
          errors.push({
            index: i,
            term: termData.term || "Unknown",
            error: "Missing required fields: term, definition",
          });
          continue;
        }

        // Create standardized financial term
        const standardizedTerm = {
          term: termData.term.trim(),
          definition: termData.definition.trim(),
          pronunciation: termData.pronunciation?.trim() || "",
          etymology: {
            origin: "Financial/Hospitality",
            originalWord: termData.etymology?.trim() || termData.term,
            meaning: termData.definition.substring(0, 50),
            period: "Modern hospitality industry",
          },
          usage: {
            primary: termData.definition.substring(0, 80),
            secondary: [],
            context: "Hospitality and financial operations",
          },
          categories: ["financial", "metric", "analysis"],
          applications: {
            primary: `Used in hospitality operations`,
            examples: [],
            contexts: ["Financial management", "Operations"],
          },
          relatedTerms: [],
          history: {
            period: "Modern hospitality",
            industry: "Hospitality",
            significance: `Important financial/operational term`,
          },
          confidence: 0.85,
          sources: [`User upload - ${new Date().toISOString().split("T")[0]}`],
          masteryLevel: "intermediate" as const,
        };

        // Add to master financial dictionary
        const keyName = termData.term
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        masterFinancialDictionary.addTerm(keyName, standardizedTerm);

        uploadedCount++;
      } catch (error) {
        errors.push({
          index: i,
          term: termData.term || "Unknown",
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred",
        });
      }
    }

    // Log summary
    console.log(
      `[Financial Term Uploader] Uploaded ${uploadedCount} financial terms`
    );

    return res.status(200).json({
      success: true,
      uploadedCount,
      totalCount: terms.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedCount} of ${terms.length} financial terms`,
    });
  } catch (error) {
    console.error("[Financial Term Uploader] Error:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during upload",
    });
  }
});

export const termUploaderRouter = router;
