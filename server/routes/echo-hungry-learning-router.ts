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
  importPDFKnowledge,
  importPDFBatch,
  getLibraryImportStatus,
  getRecipeStatistics,
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

/**
 * GET /api/echo/hungry-learning/master-dictionary/:term
 * Get comprehensive master dictionary entry with usage, etymology, and applications
 */
echoHungryLearningRouter.get('/hungry-learning/master-dictionary/:term', getMasterDictionaryEntry);

/**
 * GET /api/echo/hungry-learning/master-dictionary/category/:category
 * Get master dictionary entries by category (technique, ingredient, method, equipment, theory, etc.)
 */
echoHungryLearningRouter.get('/hungry-learning/master-dictionary/category/:category', getMasterDictionaryByCategory);

/**
 * GET /api/echo/hungry-learning/master-dictionary/mastery/:level
 * Get master dictionary entries by mastery level (fundamental, intermediate, advanced, expert, master)
 */
echoHungryLearningRouter.get('/hungry-learning/master-dictionary/mastery/:level', getMasterDictionaryByMasteryLevel);

/**
 * GET /api/echo/hungry-learning/master-dictionary/statistics
 * Get master dictionary statistics and coverage
 */
echoHungryLearningRouter.get('/hungry-learning/master-dictionary/statistics', getMasterDictionaryStatistics);

/**
 * POST /api/echo/hungry-learning/import-pdf
 * Import culinary knowledge from a single PDF file
 */
echoHungryLearningRouter.post('/hungry-learning/import-pdf', importPDFKnowledge);

/**
 * POST /api/echo/hungry-learning/import-pdf-batch
 * Import knowledge from multiple PDF files at once
 */
echoHungryLearningRouter.post('/hungry-learning/import-pdf-batch', importPDFBatch);

/**
 * GET /api/echo/hungry-learning/library-status
 * Get status of PDF library import and Echo's knowledge acquisition progress
 */
echoHungryLearningRouter.get('/hungry-learning/library-status', getLibraryImportStatus);
