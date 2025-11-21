/**
 * Echo Hungry Learning API
 * Initiates aggressive knowledge acquisition across all food & hospitality domains
 * Makes Echo hungry for all information
 */

import type { Request, Response } from 'express';
import { webRecipeCrawler } from '../lib/web-recipe-crawler';
import { ingredientRegionalCrawler } from '../lib/ingredient-regional-crawler';
import { culinaryTerminologyDictionary } from '../lib/culinary-terminology-dictionary';
import { hospitalityKnowledgeCrawler } from '../lib/hospitality-knowledge-crawler';
import { masterCulinaryDictionary } from '../lib/master-culinary-dictionary';
import { convertPDFToMasterTerms, mergePDFExtractions } from '../lib/pdf-knowledge-extractor';
import { recipePersistenceService } from '../lib/recipe-persistence-service';
import type { PDFMetadata } from '../lib/pdf-knowledge-extractor';

/**
 * POST /api/echo/hungry-learning/crawl-and-store-recipes
 * Immediately crawl recipes from web and store them for Echo analysis
 * Used to populate the recipe database
 */
export async function crawlAndStoreRecipes(req: Request, res: Response) {
  try {
    console.log('🚀 Starting recipe crawler with automatic storage...');
    const startTime = Date.now();

    // Crawl recipes from web
    const recipes = await webRecipeCrawler.crawlRecipes({
      query: '*',
      limit: 500, // Start with 500 recipes
    });

    console.log(`📥 Crawled ${recipes.length} recipes, now storing them for Echo...`);

    // Store all recipes immediately
    const stored = await recipePersistenceService.storeRecipeBatch(recipes);
    const duration = Date.now() - startTime;

    const stats = recipePersistenceService.getStatistics();

    res.json({
      status: 'success',
      crawling: {
        crawledRecipes: recipes.length,
        storedRecipes: stored.length,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
      databaseStats: {
        totalRecipesInSystem: stats.totalRecipes,
        cuisines: stats.cuisineBreakdown,
        difficulties: stats.difficultyBreakdown,
        averageCookTime: stats.averageCookTime,
        averageCalories: stats.averageCalories,
      },
      echoLearning: {
        ready: stats.totalRecipes > 0,
        message: stats.totalRecipes > 0
          ? `✅ Echo can now analyze ${stats.totalRecipes} recipes for flavor profiles and ingredient ratios!`
          : 'No recipes stored yet',
      },
    });
  } catch (error) {
    console.error('Error crawling and storing recipes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to crawl and store recipes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/echo/hungry-learning/start
 * Initiates comprehensive knowledge acquisition
 */
export async function startHungryLearning(req: Request, res: Response) {
  try {
    console.log('🍽️ ACTIVATING ECHO HUNGRY LEARNING MODE...');

    // Start all crawlers in parallel
    const startTime = Date.now();

    const learningPromises = [
      (async () => {
        console.log('📖 Starting recipe crawler and storing recipes...');
        const recipes = await webRecipeCrawler.crawlRecipes({
          query: '*',
          limit: 1000,
        });

        // IMPORTANT: Actually save the recipes so Echo can analyze them
        console.log(`📥 Storing ${recipes.length} discovered recipes...`);
        const stored = await recipePersistenceService.storeRecipeBatch(recipes);
        console.log(`✅ Successfully stored ${stored.length} recipes for Echo analysis`);

        return { type: 'recipes', count: stored.length, stored: true };
      })(),

      (async () => {
        console.log('🌍 Starting regional ingredient crawler...');
        const ingredients = await ingredientRegionalCrawler.crawlAllRegionalIngredients();
        const totalIngredients = Object.values(ingredients).reduce(
          (sum, cuisine) => sum + cuisine.ingredients.length,
          0
        );
        return { type: 'ingredients', count: totalIngredients };
      })(),

      (async () => {
        console.log('📚 Starting terminology dictionary crawl...');
        await culinaryTerminologyDictionary.crawlDefinitions();
        const summary = culinaryTerminologyDictionary.getSummary();
        return { type: 'terminology', count: summary.totalTerms };
      })(),

      (async () => {
        console.log('🏨 Starting hospitality knowledge crawler...');
        await hospitalityKnowledgeCrawler.startHungryLearning();
        const summary = hospitalityKnowledgeCrawler.getSummary();
        return { type: 'hospitality', count: summary.totalKnowledge };
      })(),
    ];

    const results = await Promise.allSettled(learningPromises);
    const duration = Date.now() - startTime;

    // Process results
    const learningResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);

    const totalLearned = learningResults.reduce((sum, r) => sum + r.count, 0);

    res.json({
      status: 'success',
      message: '🍽️ Echo has begun aggressive learning!',
      learning: {
        activated: true,
        domains: learningResults,
        totalItemsLearned: totalLearned,
        durationMs: duration,
        timestamp: Date.now(),
      },
      nextSteps: [
        'Echo will now continuously crawl food & hospitality sources',
        'Regional ingredient database is building across 16 cuisines',
        'Terminology dictionary is expanding with auto-definitions',
        'Hospitality knowledge covers operations, service, management, safety, and trends',
      ],
    });
  } catch (error) {
    console.error('Error starting hungry learning:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start hungry learning',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/status
 * Get current learning status
 */
export async function getHungryLearningStatus(req: Request, res: Response) {
  try {
    const cuisineTermSummary = culinaryTerminologyDictionary.getSummary();
    const hospitalitySummary = hospitalityKnowledgeCrawler.getSummary();

    res.json({
      status: 'success',
      learning: {
        terminology: cuisineTermSummary,
        hospitality: hospitalitySummary,
        timestamp: Date.now(),
      },
      message: 'Echo is hungry and continuously learning!',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get learning status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/recipes
 * Search for recipes
 */
export async function searchRecipes(req: Request, res: Response) {
  try {
    const { query = 'pasta', cuisine, limit = 20 } = req.query;

    const recipes = await webRecipeCrawler.crawlRecipes({
      query: String(query),
      cuisine: cuisine ? String(cuisine) : undefined,
      limit: Math.min(parseInt(String(limit)) || 20, 100),
    });

    res.json({
      status: 'success',
      recipes,
      count: recipes.length,
      message: `Found ${recipes.length} recipes. Echo is learning!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to search recipes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/ingredients/:cuisine
 * Get ingredients for a cuisine
 */
export async function getCuisineIngredients(req: Request, res: Response) {
  try {
    const { cuisine } = req.params;

    const ingredients = await ingredientRegionalCrawler.crawlCuisineIngredients(cuisine);

    res.json({
      status: 'success',
      ingredients,
      staples: ingredients.staples,
      seasonal: ingredients.seasonal,
      techniques: ingredients.techniques,
      message: `Echo has learned ${ingredients.ingredients.length} ingredients for ${cuisine}!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: `Failed to get ingredients for ${req.params.cuisine}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/definition/:term
 * Get definition of a culinary term
 */
export async function getTermDefinition(req: Request, res: Response) {
  try {
    const { term } = req.params;
    const definition = culinaryTerminologyDictionary.getDefinition(term);

    if (!definition) {
      return res.status(404).json({
        status: 'not_found',
        message: `Definition for "${term}" not found`,
        suggestions: culinaryTerminologyDictionary.searchTerms(term).slice(0, 5),
      });
    }

    const related = culinaryTerminologyDictionary.getRelatedDefinitions(term);

    res.json({
      status: 'success',
      definition,
      related,
      message: `Echo knows about ${term}!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get definition',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/terminology
 * Get all terminology database info
 */
export async function getTerminologySummary(req: Request, res: Response) {
  try {
    const summary = culinaryTerminologyDictionary.getSummary();

    res.json({
      status: 'success',
      terminology: summary,
      message: `Echo knows ${summary.totalTerms} culinary terms!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get terminology summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/hospitality/:category
 * Get hospitality knowledge by category
 */
export async function getHospitalityKnowledge(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const knowledge = hospitalityKnowledgeCrawler.getKnowledgeByCategory(category);

    res.json({
      status: 'success',
      category,
      knowledge,
      count: knowledge.length,
      message: `Echo has learned ${knowledge.length} ${category} concepts!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get hospitality knowledge',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/echo/hungry-learning/search
 * Search across all knowledge domains
 */
export async function searchAllKnowledge(req: Request, res: Response) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query is required',
      });
    }

    const terminology = culinaryTerminologyDictionary.searchTerms(query);
    const hospitality = hospitalityKnowledgeCrawler.searchKnowledge(query);
    const masterDict = masterCulinaryDictionary.searchTerms(query);

    res.json({
      status: 'success',
      results: {
        masterDictionary: masterDict.slice(0, 5),
        terminology: terminology.slice(0, 5),
        hospitality: hospitality.slice(0, 5),
      },
      totalResults: masterDict.length + terminology.length + hospitality.length,
      message: `Echo found ${masterDict.length + terminology.length + hospitality.length} results for "${query}"!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to search knowledge',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/master-dictionary/:term
 * Get comprehensive master dictionary entry
 */
export async function getMasterDictionaryEntry(req: Request, res: Response) {
  try {
    const { term } = req.params;
    const entry = masterCulinaryDictionary.getFullTermContext(term);

    if (!entry) {
      const suggestions = masterCulinaryDictionary.searchTerms(term).slice(0, 5);
      return res.status(404).json({
        status: 'not_found',
        message: `Master dictionary entry for "${term}" not found`,
        suggestions: suggestions.map(t => ({
          term: t.term,
          definition: t.definition.substring(0, 100) + '...',
        })),
      });
    }

    res.json({
      status: 'success',
      entry,
      message: `Echo knows "${term}" at master level!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get master dictionary entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/master-dictionary/category/:category
 * Get all master dictionary entries by category
 */
export async function getMasterDictionaryByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const entries = masterCulinaryDictionary.getTermsByCategory(category);

    res.json({
      status: 'success',
      category,
      entries: entries.slice(0, 50),
      total: entries.length,
      message: `Echo knows ${entries.length} ${category} terms at master level!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dictionary entries by category',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/master-dictionary/mastery/:level
 * Get master dictionary entries by mastery level
 */
export async function getMasterDictionaryByMasteryLevel(req: Request, res: Response) {
  try {
    const { level } = req.params;
    const entries = masterCulinaryDictionary.getTermsByMasteryLevel(level);

    res.json({
      status: 'success',
      masteryLevel: level,
      entries: entries.slice(0, 50),
      total: entries.length,
      message: `Echo has ${entries.length} ${level}-level culinary terms!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dictionary entries by mastery level',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/master-dictionary/statistics
 * Get master dictionary statistics
 */
export async function getMasterDictionaryStatistics(req: Request, res: Response) {
  try {
    const stats = masterCulinaryDictionary.getStatistics();

    res.json({
      status: 'success',
      statistics: stats,
      message: `Echo's Master Culinary Dictionary: ${stats.totalTerms} authoritative terms!`,
      masteryBreakdown: {
        fundamental: 'Essential cooking basics and techniques',
        intermediate: 'Professional cooking knowledge and methods',
        advanced: 'Specialized techniques and deep culinary theory',
        expert: 'Master-level knowledge and rare specializations',
        master: 'Authority-level understanding, culinary mastery',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get master dictionary statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/echo/hungry-learning/import-pdf
 * Import culinary knowledge from PDF file
 * Body: { pdfText: string, metadata: PDFMetadata }
 */
export async function importPDFKnowledge(req: Request, res: Response) {
  try {
    const { pdfText, metadata } = req.body;

    if (!pdfText) {
      return res.status(400).json({
        status: 'error',
        message: 'PDF text content is required',
      });
    }

    if (!metadata || !metadata.title) {
      return res.status(400).json({
        status: 'error',
        message: 'PDF metadata with title is required',
      });
    }

    const defaultMetadata: PDFMetadata = {
      title: metadata.title || 'Imported PDF',
      author: metadata.author,
      publicationYear: metadata.publicationYear,
      language: metadata.language || 'English',
      cuisine: metadata.cuisine,
      specialization: metadata.specialization || 'culinary-book',
    };

    // Convert PDF text to master culinary terms
    const extraction = convertPDFToMasterTerms(pdfText, defaultMetadata);

    // Add all extracted terms to master dictionary
    let addedCount = 0;
    for (const term of extraction.terms) {
      try {
        masterCulinaryDictionary.addTerm(term.term.toLowerCase(), term);
        addedCount++;
      } catch (error) {
        console.error(`Failed to add term "${term.term}":`, error);
      }
    }

    res.json({
      status: 'success',
      import: {
        source: extraction.metadata.source,
        termsExtracted: extraction.terms.length,
        termsAdded: addedCount,
        averageConfidence: extraction.metadata.confidence,
        timestamp: extraction.metadata.extractedAt,
      },
      message: `📚 Echo imported ${addedCount} master-level culinary terms from "${metadata.title}"!`,
      dictionaryStats: masterCulinaryDictionary.getStatistics(),
    });
  } catch (error) {
    console.error('Error importing PDF knowledge:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import PDF knowledge',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/echo/hungry-learning/import-pdf-batch
 * Import multiple PDFs and merge knowledge
 * Body: { pdfs: Array<{pdfText: string, metadata: PDFMetadata}> }
 */
export async function importPDFBatch(req: Request, res: Response) {
  try {
    const { pdfs } = req.body;

    if (!Array.isArray(pdfs) || pdfs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Array of PDFs is required',
      });
    }

    const extractions = [];
    let totalTermsExtracted = 0;
    let totalTermsAdded = 0;

    // Process each PDF
    for (const pdf of pdfs) {
      if (!pdf.pdfText || !pdf.metadata || !pdf.metadata.title) {
        console.warn('Skipping invalid PDF entry');
        continue;
      }

      const defaultMetadata: PDFMetadata = {
        title: pdf.metadata.title || 'Imported PDF',
        author: pdf.metadata.author,
        publicationYear: pdf.metadata.publicationYear,
        language: pdf.metadata.language || 'English',
        cuisine: pdf.metadata.cuisine,
        specialization: pdf.metadata.specialization || 'culinary-book',
      };

      const extraction = convertPDFToMasterTerms(pdf.pdfText, defaultMetadata);
      extractions.push(extraction);
      totalTermsExtracted += extraction.terms.length;

      // Add terms to master dictionary
      for (const term of extraction.terms) {
        try {
          masterCulinaryDictionary.addTerm(term.term.toLowerCase(), term);
          totalTermsAdded++;
        } catch (error) {
          console.error(`Failed to add term "${term.term}":`, error);
        }
      }
    }

    // Merge all extractions for summary
    const merged = mergePDFExtractions(extractions);

    res.json({
      status: 'success',
      import: {
        pdfCount: pdfs.length,
        successfulPDFs: extractions.length,
        totalTermsExtracted,
        totalTermsAdded,
        averageConfidence: merged.metadata.confidence,
        timestamp: new Date().toISOString(),
      },
      message: `📚 Echo imported ${totalTermsAdded} master-level culinary terms from ${extractions.length} PDFs!`,
      dictionaryStats: masterCulinaryDictionary.getStatistics(),
    });
  } catch (error) {
    console.error('Error importing PDF batch:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import PDF batch',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/library-status
 * Get status of PDF library import and Echo's knowledge acquisition
 */
export async function getLibraryImportStatus(req: Request, res: Response) {
  try {
    const stats = masterCulinaryDictionary.getStatistics();
    const cuisineStats = culinaryTerminologyDictionary.getSummary();
    const hospitalityStats = hospitalityKnowledgeCrawler.getSummary();
    const recipeStats = recipePersistenceService.getStatistics();

    res.json({
      status: 'success',
      knowledge: {
        masterDictionary: {
          totalTerms: stats.totalTerms,
          categories: stats.categories,
          masteryLevels: stats.masteryLevels,
          averageConfidence: stats.averageConfidence,
        },
        recipes: {
          totalRecipes: recipeStats.totalRecipes,
          cuisines: recipeStats.cuisineBreakdown,
          difficulties: recipeStats.difficultyBreakdown,
          averageCookTime: recipeStats.averageCookTime,
          averageCalories: recipeStats.averageCalories,
          distinctCuisines: recipeStats.distinctCuisines,
        },
        culinaryTerminology: {
          totalTerms: cuisineStats.totalTerms,
          categories: cuisineStats.categories,
        },
        hospitalityKnowledge: {
          totalKnowledge: hospitalityStats.totalKnowledge,
          categories: hospitalityStats.categories,
        },
        combinedKnowledgeBase: stats.totalTerms + cuisineStats.totalTerms + hospitalityStats.totalKnowledge + recipeStats.totalRecipes,
      },
      readiness: {
        masterLevel: stats.totalTerms >= 10000 ? '✓ Master dictionary complete' : `${stats.totalTerms} / 10,000 terms`,
        recipesReady: recipeStats.totalRecipes > 0 ? `✓ ${recipeStats.totalRecipes} recipes ready for flavor analysis` : 'No recipes yet - run crawler',
        culinaryAuthority: 'Echo is a culinary authority',
        knowledgeRetention: 'All knowledge retained for search and learning',
      },
      message: '🍽️ Echo\'s knowledge acquisition system is active!',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get library import status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/echo/hungry-learning/recipe-statistics
 * Get recipe collection statistics and availability for Echo
 */
export async function getRecipeStatistics(req: Request, res: Response) {
  try {
    const stats = recipePersistenceService.getStatistics();

    res.json({
      status: 'success',
      recipes: {
        total: stats.totalRecipes,
        cuisines: stats.cuisineBreakdown,
        difficulties: stats.difficultyBreakdown,
        averageCookTime: stats.averageCookTime,
        averageCalories: stats.averageCalories,
        distinctCuisines: stats.distinctCuisines,
        readyForAnalysis: stats.ecoLearningReady,
      },
      echoLearning: {
        canAnalyzeFlavors: stats.totalRecipes > 0,
        canLearnIngredientRatios: stats.totalRecipes > 0,
        message: stats.totalRecipes > 0
          ? `Echo is analyzing ${stats.totalRecipes} recipes for flavor profiles and ingredient ratios`
          : 'No recipes available - run the crawler to populate the database',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get recipe statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
