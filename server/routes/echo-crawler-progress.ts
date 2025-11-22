import type { Request, Response } from 'express';
import { webRecipeCrawler } from '../lib/web-recipe-crawler';
import { ingredientRegionalCrawler } from '../lib/ingredient-regional-crawler';

interface CrawlerProgressEvent {
  type: 'start' | 'recipe' | 'knowledge' | 'complete' | 'error';
  timestamp: number;
  data: {
    currentUrl?: string;
    currentRecipe?: string;
    recipesProcessed?: number;
    totalRecipes?: number;
    ingredientsFound?: string[];
    techniqueFound?: string[];
    knowledgeUpdates?: {
      ingredientsTaught: number;
      techniquesLearned: number;
      flavorProfilesAnalyzed: number;
      unknownTermsIdentified: string[];
    };
    message?: string;
    error?: string;
  };
}

// Store active SSE connections for a user session
const activeConnections = new Map<string, Response>();

/**
 * GET /api/echo/crawler/progress?sessionId=xxx
 * Server-Sent Events endpoint for real-time crawler progress
 */
export async function getCrawlerProgress(req: Request, res: Response) {
  const sessionId = req.query.sessionId as string;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection confirmation
  sendEvent(res, {
    type: 'start',
    timestamp: Date.now(),
    data: {
      message: 'Connected to crawler progress stream'
    }
  });

  // Store connection
  activeConnections.set(sessionId, res);

  // Cleanup on disconnect
  req.on('close', () => {
    activeConnections.delete(sessionId);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    sendEvent(res, {
      type: 'ping',
      timestamp: Date.now(),
      data: { message: 'Connection active' }
    });
  }, 30000);

  res.on('close', () => {
    clearInterval(keepAlive);
  });
}

/**
 * POST /api/echo/crawler/start-crawl
 * Start crawling with real-time progress reporting
 */
export async function startCrawlerSession(req: Request, res: Response) {
  const { sessionId, maxRecipes = 500, cuisines = [], sources = [] } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  res.json({ 
    success: true, 
    sessionId,
    message: 'Crawler session started. Connect to /api/echo/crawler/progress for updates.'
  });

  // Start crawling asynchronously
  crawlAndReportProgress(sessionId, { maxRecipes, cuisines, sources });
}

/**
 * Main crawling function with progress reporting
 */
async function crawlAndReportProgress(
  sessionId: string,
  options: { maxRecipes: number; cuisines: string[]; sources: string[] }
) {
  const connection = activeConnections.get(sessionId);
  const knowledgeState = {
    ingredientsTaught: 0,
    techniquesLearned: 0,
    flavorProfilesAnalyzed: 0,
    unknownTermsIdentified: new Set<string>(),
    ingredientsLearned: new Set<string>(),
    techniquesLearned: new Set<string>(),
  };

  try {
    // Stage 1: Crawl recipes
    const crawledRecipes = await webRecipeCrawler.crawlRecipes({
      query: '*',
      limit: options.maxRecipes,
    });

    if (connection) {
      sendEvent(connection, {
        type: 'recipe',
        timestamp: Date.now(),
        data: {
          message: `Crawled ${crawledRecipes.length} recipes`,
          recipesProcessed: 0,
          totalRecipes: crawledRecipes.length,
        }
      });
    }

    // Stage 2: Process each recipe for knowledge extraction
    for (let i = 0; i < crawledRecipes.length; i++) {
      const recipe = crawledRecipes[i];

      if (connection) {
        sendEvent(connection, {
          type: 'recipe',
          timestamp: Date.now(),
          data: {
            currentUrl: recipe.url,
            currentRecipe: recipe.title,
            recipesProcessed: i + 1,
            totalRecipes: crawledRecipes.length,
            message: `Processing: ${recipe.title}`,
          }
        });
      }

      // Extract ingredients and check for unknown terms
      const unknownTerms: string[] = [];
      if (recipe.ingredients) {
        for (const ingredient of recipe.ingredients) {
          knowledgeState.ingredientsLearned.add(ingredient.name);
          
          // Simple check: if ingredient contains unusual characters or is longer than typical, flag it
          if (ingredient.name.length > 20 || /[^a-z\s\-]/i.test(ingredient.name)) {
            unknownTerms.push(ingredient.name);
          }
        }
      }

      // Extract techniques
      if (recipe.techniques) {
        for (const technique of recipe.techniques) {
          knowledgeState.techniquesLearned.add(technique);
        }
      }

      // Update flavor profile knowledge
      if (recipe.flavor) {
        knowledgeState.flavorProfilesAnalyzed++;
      }

      // Add unknown terms to tracking
      unknownTerms.forEach(term => knowledgeState.unknownTermsIdentified.add(term));

      // Send knowledge update
      if (connection && (i % 5 === 0 || unknownTerms.length > 0)) {
        sendEvent(connection, {
          type: 'knowledge',
          timestamp: Date.now(),
          data: {
            currentRecipe: recipe.title,
            ingredientsFound: Array.from(knowledgeState.ingredientsLearned).slice(-10),
            techniqueFound: Array.from(knowledgeState.techniquesLearned).slice(-5),
            knowledgeUpdates: {
              ingredientsTaught: knowledgeState.ingredientsLearned.size,
              techniquesLearned: knowledgeState.techniquesLearned.size,
              flavorProfilesAnalyzed: knowledgeState.flavorProfilesAnalyzed,
              unknownTermsIdentified: Array.from(knowledgeState.unknownTermsIdentified),
            }
          }
        });
      }
    }

    // Stage 3: Query unknown terms via Claude
    const unknownTermsList = Array.from(knowledgeState.unknownTermsIdentified);
    if (unknownTermsList.length > 0 && connection) {
      sendEvent(connection, {
        type: 'recipe',
        timestamp: Date.now(),
        data: {
          message: `Learning ${unknownTermsList.length} unknown ingredients/terms...`
        }
      });

      // TODO: Call Claude/OpenAI API for unknown terms
      // This would happen asynchronously and results would be cached
    }

    // Final report
    if (connection) {
      sendEvent(connection, {
        type: 'complete',
        timestamp: Date.now(),
        data: {
          message: 'Crawl and knowledge extraction complete!',
          knowledgeUpdates: {
            ingredientsTaught: knowledgeState.ingredientsLearned.size,
            techniquesLearned: knowledgeState.techniquesLearned.size,
            flavorProfilesAnalyzed: knowledgeState.flavorProfilesAnalyzed,
            unknownTermsIdentified: Array.from(knowledgeState.unknownTermsIdentified),
          }
        }
      });
    }

  } catch (error) {
    if (connection) {
      sendEvent(connection, {
        type: 'error',
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Crawler failed'
        }
      });
    }
  }
}

/**
 * Helper function to send SSE events
 */
function sendEvent(connection: Response, event: CrawlerProgressEvent) {
  try {
    connection.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch (e) {
    // Connection may be closed
  }
}

/**
 * GET /api/echo/crawler/stats
 * Get current crawler statistics
 */
export async function getCrawlerStats(req: Request, res: Response) {
  const stats = {
    activeConnections: activeConnections.size,
    timestamp: Date.now(),
  };

  res.json(stats);
}
