import type { Request, Response } from 'express';
import { webRecipeCrawler } from '../lib/web-recipe-crawler';
import { ingredientRegionalCrawler } from '../lib/ingredient-regional-crawler';
import { llmKnowledgeEnricher } from '../lib/llm-knowledge-enricher';
import { knowledgeUpdater } from '../lib/knowledge-updater';
import { globalCrawlerManager } from '../lib/crawler-framework';
import { siteCrawlers } from '../lib/site-crawlers';
import { flavorMatrixService } from '../lib/flavor-matrix-service';

interface CrawlerProgressEvent {
  type: 'start' | 'recipe' | 'knowledge' | 'learning' | 'complete' | 'error';
  timestamp: number;
  data: {
    currentUrl?: string;
    currentRecipe?: string;
    recipesProcessed?: number;
    totalRecipes?: number;
    ingredientsFound?: string[];
    techniqueFound?: string[];
    termsBeingLearned?: string[];
    termsLearned?: number;
    termsFailedToLearn?: number;
    knowledgeUpdates?: {
      ingredientsTaught: number;
      techniquesLearned: number;
      flavorProfilesAnalyzed: number;
      unknownTermsIdentified: string[];
      autoLearningComplete?: boolean;
      autoLearningStats?: {
        successful: number;
        failed: number;
      };
    };
    message?: string;
    error?: string;
  };
}

// Store active SSE connections for a user session
const activeConnections = new Map<string, Response>();

// Initialize Phase 4 global crawler with all site adapters
function initializeGlobalCrawler() {
  console.log('[Crawler] Initializing global crawler with site adapters...');
  for (const crawler of siteCrawlers) {
    globalCrawlerManager.registerAdapter(crawler);
    console.log(`[Crawler] Registered: ${crawler.name} (${crawler.domain})`);
  }
  console.log(`[Crawler] Total adapters registered: ${globalCrawlerManager.getAllAdapters().length}`);
}

// Initialize on module load
initializeGlobalCrawler();

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
 * Supports Phase 1 (legacy) and Phase 4 (global) crawling modes
 */
export async function startCrawlerSession(req: Request, res: Response) {
  const {
    sessionId,
    maxRecipes = 500,
    cuisines = [],
    sources = [],
    mode = 'legacy', // 'legacy' or 'global'
    extractFlavorData = false,
    autoLearn = true,
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  res.json({
    success: true,
    sessionId,
    mode,
    message: `Crawler session started in ${mode} mode. Connect to /api/echo/crawler/progress for updates.`
  });

  // Start crawling asynchronously (with small delay to let SSE connection establish)
  setTimeout(() => {
    if (mode === 'global') {
      crawlGlobalAndReportProgress(sessionId, {
        maxRecipes,
        cuisines,
        sources,
        extractFlavorData,
        autoLearn,
      });
    } else {
      crawlAndReportProgress(sessionId, { maxRecipes, cuisines, sources });
    }
  }, 200);
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

    // Stage 3: Auto-Learning - Query unknown terms via OpenAI
    const unknownTermsList = Array.from(knowledgeState.unknownTermsIdentified);
    let learningStats = { successful: 0, failed: 0 };

    if (unknownTermsList.length > 0 && connection) {
      // Initialize learning session
      knowledgeUpdater.createSession(sessionId, 'crawler');

      // Send learning start message
      sendEvent(connection, {
        type: 'learning',
        timestamp: Date.now(),
        data: {
          message: `🧠 Starting auto-learning: Enriching ${unknownTermsList.length} unknown ingredients/terms...`,
          termsBeingLearned: unknownTermsList.slice(0, 10),
        }
      });

      try {
        // Enrich terms using LLM (with rate limiting)
        const enrichmentResults = await llmKnowledgeEnricher.enrichTerms(
          unknownTermsList,
          3 // Max 3 concurrent requests
        );

        if (enrichmentResults.length > 0) {
          // Extract knowledge items from enrichment results
          const knowledgeItems = enrichmentResults.map(result => result.knowledge);

          // Send progress during storage
          sendEvent(connection, {
            type: 'learning',
            timestamp: Date.now(),
            data: {
              message: `📚 Storing ${knowledgeItems.length} learned concepts...`,
              termsLearned: enrichmentResults.length,
            }
          });

          // Store enriched knowledge
          learningStats = await knowledgeUpdater.storeEnrichedKnowledge(
            sessionId,
            knowledgeItems
          );

          // Send learning completion stats
          sendEvent(connection, {
            type: 'learning',
            timestamp: Date.now(),
            data: {
              message: `✅ Auto-learning complete: ${learningStats.successful} concepts learned, ${learningStats.failed} failed`,
              termsLearned: learningStats.successful,
              termsFailedToLearn: learningStats.failed,
            }
          });
        }
      } catch (error) {
        console.error('Auto-learning failed:', error);
        sendEvent(connection, {
          type: 'learning',
          timestamp: Date.now(),
          data: {
            message: `⚠️ Auto-learning encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            termsFailedToLearn: unknownTermsList.length,
          }
        });
      }

      // Complete the learning session
      knowledgeUpdater.completeSession(sessionId);
    }

    // Final report
    if (connection) {
      const sessionSummary = knowledgeUpdater.getSessionStats(sessionId);
      sendEvent(connection, {
        type: 'complete',
        timestamp: Date.now(),
        data: {
          message: '🎉 Crawl and auto-learning complete!',
          knowledgeUpdates: {
            ingredientsTaught: knowledgeState.ingredientsLearned.size,
            techniquesLearned: knowledgeState.techniquesLearned.size,
            flavorProfilesAnalyzed: knowledgeState.flavorProfilesAnalyzed,
            unknownTermsIdentified: Array.from(knowledgeState.unknownTermsIdentified),
            autoLearningComplete: true,
            autoLearningStats: {
              successful: learningStats.successful,
              failed: learningStats.failed,
            }
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
 * Phase 4: Global crawling function with multi-source support
 */
async function crawlGlobalAndReportProgress(
  sessionId: string,
  options: {
    maxRecipes: number;
    cuisines: string[];
    sources: string[];
    extractFlavorData: boolean;
    autoLearn: boolean;
  }
) {
  const connection = activeConnections.get(sessionId);
  const knowledgeState = {
    ingredientsTaught: 0,
    techniquesLearned: 0,
    flavorProfilesAnalyzed: 0,
    unknownTermsIdentified: new Set<string>(),
    ingredientsLearned: new Set<string>(),
    techniquesLearned: new Set<string>(),
    sourcesUsed: new Set<string>(),
  };

  try {
    if (connection) {
      sendEvent(connection, {
        type: 'recipe',
        timestamp: Date.now(),
        data: {
          message: '🌍 Starting Phase 4 Global Crawler - Multi-source learning in progress...'
        }
      });
    }

    // Stage 1: Crawl from all active sources globally
    const crawlerOptions = {
      query: '*',
      limit: options.maxRecipes,
      extractFlavorData: options.extractFlavorData,
    };

    console.log('[Crawler] Starting global crawl with options:', crawlerOptions);
    console.log('[Crawler] Active adapters:', globalCrawlerManager.getAllAdapters().filter(a => a.isActive).map(a => a.name));

    const { recipes: crawledRecipes, flavorMatrix } =
      await globalCrawlerManager.crawlGlobal(crawlerOptions, 5);

    console.log(`[Crawler] Crawl completed: ${crawledRecipes.length} recipes found`);

    if (connection) {
      sendEvent(connection, {
        type: 'recipe',
        timestamp: Date.now(),
        data: {
          message: `✅ Crawled ${crawledRecipes.length} recipes from ${globalCrawlerManager.getAllAdapters().filter(a => a.isActive).length} global sources`,
          recipesProcessed: 0,
          totalRecipes: crawledRecipes.length,
        }
      });
    }

    // Stage 2: Process recipes and extract flavor data
    let flavorCount = 0;
    for (let i = 0; i < crawledRecipes.length; i++) {
      const recipe = crawledRecipes[i];

      knowledgeState.sourcesUsed.add(recipe.source);

      if (connection && i % 10 === 0) {
        sendEvent(connection, {
          type: 'recipe',
          timestamp: Date.now(),
          data: {
            currentRecipe: recipe.title,
            currentUrl: recipe.url,
            recipesProcessed: i + 1,
            totalRecipes: crawledRecipes.length,
            message: `Processing: ${recipe.title} (${recipe.source})`,
          }
        });
      }

      // Extract ingredients and techniques
      if (recipe.ingredients) {
        for (const ingredient of recipe.ingredients) {
          knowledgeState.ingredientsLearned.add(ingredient.name);
          if (ingredient.name.length > 20 || /[^a-z\s\-]/i.test(ingredient.name)) {
            knowledgeState.unknownTermsIdentified.add(ingredient.name);
          }
        }
      }

      if (recipe.techniques) {
        for (const technique of recipe.techniques) {
          knowledgeState.techniquesLearned.add(technique);
        }
      }

      if (recipe.flavor) {
        flavorCount++;
      }
    }

    knowledgeState.ingredientsTaught = knowledgeState.ingredientsLearned.size;
    knowledgeState.techniquesLearned = knowledgeState.techniquesLearned.size;
    knowledgeState.flavorProfilesAnalyzed = flavorCount;

    // Stage 3: Store flavor matrix entries
    if (options.extractFlavorData && flavorMatrix.length > 0) {
      if (connection) {
        sendEvent(connection, {
          type: 'knowledge',
          timestamp: Date.now(),
          data: {
            message: `📊 Building global flavor matrix from ${flavorMatrix.length} recipes...`
          }
        });
      }

      const { stored, failed } = await flavorMatrixService.storeEntries(flavorMatrix);

      if (connection) {
        sendEvent(connection, {
          type: 'knowledge',
          timestamp: Date.now(),
          data: {
            message: `✅ Flavor matrix updated: ${stored} recipes analyzed, ${failed} failed`
          }
        });
      }
    }

    // Stage 4: Auto-Learning
    if (options.autoLearn) {
      const unknownTermsList = Array.from(knowledgeState.unknownTermsIdentified);
      let learningStats = { successful: 0, failed: 0 };

      if (unknownTermsList.length > 0) {
        knowledgeUpdater.createSession(sessionId, 'crawler');

        if (connection) {
          sendEvent(connection, {
            type: 'learning',
            timestamp: Date.now(),
            data: {
              message: `🧠 Auto-Learning: Enriching ${unknownTermsList.length} unknown terms from global recipes...`,
              termsBeingLearned: unknownTermsList.slice(0, 10),
            }
          });
        }

        try {
          const enrichmentResults = await llmKnowledgeEnricher.enrichTerms(
            unknownTermsList,
            3
          );

          if (enrichmentResults.length > 0) {
            const knowledgeItems = enrichmentResults.map(result => result.knowledge);

            if (connection) {
              sendEvent(connection, {
                type: 'learning',
                timestamp: Date.now(),
                data: {
                  message: `📚 Storing ${knowledgeItems.length} globally-sourced concepts...`,
                  termsLearned: enrichmentResults.length,
                }
              });
            }

            learningStats = await knowledgeUpdater.storeEnrichedKnowledge(
              sessionId,
              knowledgeItems
            );

            if (connection) {
              sendEvent(connection, {
                type: 'learning',
                timestamp: Date.now(),
                data: {
                  message: `✅ Global learning complete: ${learningStats.successful} concepts learned`,
                  termsLearned: learningStats.successful,
                  termsFailedToLearn: learningStats.failed,
                }
              });
            }
          }
        } catch (error) {
          console.error('Global auto-learning failed:', error);
        }

        knowledgeUpdater.completeSession(sessionId);
      }
    }

    // Final report
    if (connection) {
      const flavorMatrixStats = flavorMatrixService.getStatistics();
      sendEvent(connection, {
        type: 'complete',
        timestamp: Date.now(),
        data: {
          message: `🎉 Phase 4 Global Crawl Complete! 🌍`,
          knowledgeUpdates: {
            ingredientsTaught: knowledgeState.ingredientsTaught,
            techniquesLearned: knowledgeState.techniquesLearned,
            flavorProfilesAnalyzed: knowledgeState.flavorProfilesAnalyzed,
            unknownTermsIdentified: Array.from(knowledgeState.unknownTermsIdentified),
            sourcesUsed: Array.from(knowledgeState.sourcesUsed),
            flavorMatrixStats: {
              totalRecipes: flavorMatrixStats.totalRecipes,
              totalCuisines: flavorMatrixStats.totalCuisines,
              totalIngredients: flavorMatrixStats.totalIngredients,
              totalTechniques: flavorMatrixStats.totalTechniques,
            },
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
          message: 'Global crawler failed'
        }
      });
    }
    console.error('Global crawling error:', error);
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

/**
 * GET /api/echo/crawler/flavor-matrix
 * Get global flavor matrix data
 */
export async function getFlavorMatrix(req: Request, res: Response) {
  const flavorMatrix = flavorMatrixService.getMatrix();
  const statistics = flavorMatrixService.getStatistics();

  res.json({
    matrix: flavorMatrix,
    statistics,
    topCuisines: flavorMatrixService.getTopCuisines(10),
    topSensoryDescriptors: flavorMatrixService.getTopSensoryDescriptors(15),
    topIngredients: flavorMatrixService.getMostDocumentedIngredients(15),
    topTechniques: flavorMatrixService.getMostDocumentedTechniques(10),
  });
}

/**
 * GET /api/echo/crawler/ingredient-flavor/:ingredient
 * Get flavor profile for a specific ingredient
 */
export async function getIngredientFlavorProfile(req: Request, res: Response) {
  const { ingredient } = req.params;
  const profile = flavorMatrixService.getIngredientProfile(ingredient);
  const similar = flavorMatrixService.findSimilarIngredients(ingredient, 10);

  if (!profile) {
    return res.status(404).json({
      error: `No flavor profile found for ingredient: ${ingredient}`,
      similar,
    });
  }

  res.json({
    ingredient,
    profile,
    similar,
  });
}

/**
 * GET /api/echo/crawler/cuisine-flavor/:cuisine
 * Get flavor pattern for a specific cuisine
 */
export async function getCuisineFlavor(req: Request, res: Response) {
  const { cuisine } = req.params;
  const profile = flavorMatrixService.getCulturalFlavorPattern(cuisine);

  if (!profile) {
    return res.status(404).json({
      error: `No flavor pattern found for cuisine: ${cuisine}`,
      availableCuisines: flavorMatrixService.getTopCuisines(20),
    });
  }

  res.json({
    cuisine,
    profile,
  });
}
