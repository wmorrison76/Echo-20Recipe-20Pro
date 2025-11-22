import { Router, type Request, type Response } from 'express';
import { getCrawlerProgress, startCrawlerSession, getCrawlerStats } from './echo-crawler-progress';

export const echoCrawlerRouter = Router();

/**
 * GET /api/echo/crawler/progress
 * Server-Sent Events endpoint for real-time crawler progress
 */
echoCrawlerRouter.get('/crawler/progress', getCrawlerProgress);

/**
 * POST /api/echo/crawler/start-crawl
 * Start a new crawler session with real-time progress
 */
echoCrawlerRouter.post('/crawler/start-crawl', startCrawlerSession);

/**
 * GET /api/echo/crawler/stats
 * Get current crawler statistics
 */
echoCrawlerRouter.get('/crawler/stats', getCrawlerStats);

export default echoCrawlerRouter;
