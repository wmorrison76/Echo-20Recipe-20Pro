import express from 'express';
import {
  startHungryLearning,
  getHungryLearningStatus,
  searchRecipes,
  getCuisineIngredients,
  getTermDefinition,
  getTerminologySummary,
  getHospitalityKnowledge,
  searchAllKnowledge,
  getMasterDictionaryEntry,
  getMasterDictionaryByCategory,
  getMasterDictionaryByMasteryLevel,
  getMasterDictionaryStatistics,
} from './echo-hungry-learning';

export const echoHungryLearningRouter = express.Router();

/**
 * POST /api/echo/hungry-learning/start
 * Initiate comprehensive knowledge acquisition
 */
echoHungryLearningRouter.post('/hungry-learning/start', startHungryLearning);

/**
 * GET /api/echo/hungry-learning/status
 * Get current learning status
 */
echoHungryLearningRouter.get('/hungry-learning/status', getHungryLearningStatus);

/**
 * GET /api/echo/hungry-learning/recipes
 * Search for recipes across all sources
 */
echoHungryLearningRouter.get('/hungry-learning/recipes', searchRecipes);

/**
 * GET /api/echo/hungry-learning/ingredients/:cuisine
 * Get ingredients for a specific cuisine
 */
echoHungryLearningRouter.get('/hungry-learning/ingredients/:cuisine', getCuisineIngredients);

/**
 * GET /api/echo/hungry-learning/definition/:term
 * Get definition of a culinary term
 */
echoHungryLearningRouter.get('/hungry-learning/definition/:term', getTermDefinition);

/**
 * GET /api/echo/hungry-learning/terminology
 * Get terminology database summary
 */
echoHungryLearningRouter.get('/hungry-learning/terminology', getTerminologySummary);

/**
 * GET /api/echo/hungry-learning/hospitality/:category
 * Get hospitality knowledge by category
 */
echoHungryLearningRouter.get('/hungry-learning/hospitality/:category', getHospitalityKnowledge);

/**
 * POST /api/echo/hungry-learning/search
 * Search across all knowledge domains
 */
echoHungryLearningRouter.post('/hungry-learning/search', searchAllKnowledge);
