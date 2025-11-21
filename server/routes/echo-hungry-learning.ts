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
        console.log('📖 Starting recipe crawler...');
        const recipes = await webRecipeCrawler.crawlRecipes({
          query: '*',
          limit: 1000,
        });
        return { type: 'recipes', count: recipes.length };
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

    res.json({
      status: 'success',
      results: {
        terminology: terminology.slice(0, 5),
        hospitality: hospitality.slice(0, 5),
      },
      totalResults: terminology.length + hospitality.length,
      message: `Echo found ${terminology.length + hospitality.length} results for "${query}"!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to search knowledge',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
