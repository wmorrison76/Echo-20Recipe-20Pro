/**
 * Background Knowledge Crawler Service
 * Continuously crawls and builds knowledge base in development mode
 * Pauses or switches to on-demand in production mode
 */

import KnowledgeManager from "../cognition/knowledgeManager";
import KnowledgeProgressTracker from "./knowledgeProgressTracker";
import type { RecipeCodexMetadata } from "../codex";

export interface BackgroundCrawlerConfig {
  enabled: boolean;
  mode: "learning" | "on_demand";
  crawlIntervalMs: number; // milliseconds between crawls
  batchSize: number;
  topics: string[];
  autoSwitchWhenReady: boolean;
}

/**
 * Background Crawler
 * Runs knowledge crawler in the background during development
 */
export class BackgroundKnowledgeCrawler {
  private manager: KnowledgeManager | null = null;
  private tracker: KnowledgeProgressTracker | null = null;
  private config: BackgroundCrawlerConfig;
  private crawlTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private crawlCount = 0;

  constructor(config: Partial<BackgroundCrawlerConfig> = {}) {
    this.config = {
      enabled: true,
      mode: "learning",
      crawlIntervalMs: 60000, // 1 minute for testing, would be longer in prod
      batchSize: 5,
      topics: [
        "allergen safety",
        "flavor chemistry",
        "pastry techniques",
        "baking science",
        "banquet service",
        "catering logistics",
        "culinary terminology",
        "ingredient sourcing",
        "nutritional data",
        "regional cuisines",
        "molecular gastronomy",
        "preservation techniques",
        "food safety",
        "menu design",
        "cost optimization",
        "sustainable cooking",
      ],
      autoSwitchWhenReady: true,
      ...config,
    };
  }

  /**
   * Initialize the crawler with knowledge base
   */
  initialize(recipes: RecipeCodexMetadata[], ingredients: Record<string, any>): void {
    if (this.manager) return; // Already initialized

    this.manager = new KnowledgeManager({
      enableAutoCrawl: false,
      enableAutoVetting: true,
      enableGapDetection: true,
    });

    this.tracker = new KnowledgeProgressTracker();

    this.manager.registerKnowledgeBase(recipes, ingredients);

    console.log("✅ Background Knowledge Crawler initialized");

    if (this.config.enabled && this.config.mode === "learning") {
      this.start();
    }
  }

  /**
   * Start the background crawler
   */
  start(): void {
    if (this.isRunning || !this.manager) {
      console.warn("Crawler already running or not initialized");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting Background Knowledge Crawler (Learning Mode)");

    // First crawl immediately
    this.runCrawlBatch();

    // Then schedule periodic crawls
    this.crawlTimer = setInterval(() => {
      this.runCrawlBatch();
    }, this.config.crawlIntervalMs);
  }

  /**
   * Stop the background crawler
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.crawlTimer) {
      clearInterval(this.crawlTimer);
      this.crawlTimer = null;
    }

    this.isRunning = false;
    console.log("⏹️ Background Knowledge Crawler stopped");
  }

  /**
   * Run a batch of crawls
   */
  private async runCrawlBatch(): Promise<void> {
    if (!this.manager || !this.tracker) return;

    try {
      const topicsToProcess = this.selectTopicsForBatch();

      console.log(
        `📚 Crawling batch ${this.crawlCount + 1}: ${topicsToProcess.join(", ")}`
      );

      for (const topic of topicsToProcess) {
        try {
          const result = await this.manager.expandKnowledge(topic, "scheduled");

          // Update progress tracker
          const metadata: Record<string, any> = {};
          result.newlyApprovedKnowledge.forEach((k) => {
            metadata[k.id] = k.metadata;
          });

          this.tracker.updateWithCrawlResults(
            result.newlyApprovedKnowledge.length,
            result.vetResult.filter((v) => v.level === "rejected").length,
            result.vetResult.filter((v) => v.level === "quarantined").length,
            metadata
          );

          console.log(
            `✅ ${topic}: ${result.newlyApprovedKnowledge.length} approved, ${result.crawlResult.failureCount} failures`
          );
        } catch (error) {
          console.warn(`⚠️ Failed to crawl "${topic}":`, error);
        }
      }

      this.crawlCount++;

      // Check if should switch modes
      if (this.config.autoSwitchWhenReady) {
        const progress = this.tracker.getProgressState();
        if (progress.mode === "on_demand") {
          console.log(
            "✨ Auto-switched to On-Demand Mode - Knowledge base is substantial!"
          );
          this.config.mode = "on_demand";
          this.stop();
        }
      }

      // Log progress
      const progress = this.tracker.getSummary();
      console.log(`📊 Progress: ${progress.progress}`);
      if (progress.nextThreshold) {
        console.log(`   Next threshold: ${progress.nextThreshold}`);
      }
    } catch (error) {
      console.error("❌ Crawler batch failed:", error);
    }
  }

  /**
   * Select topics for this batch
   */
  private selectTopicsForBatch(): string[] {
    const start = (this.crawlCount * this.config.batchSize) % this.config.topics.length;
    const selected = [];

    for (let i = 0; i < this.config.batchSize; i++) {
      const index = (start + i) % this.config.topics.length;
      selected.push(this.config.topics[index]);
    }

    return selected;
  }

  /**
   * Manually trigger a crawl
   */
  async crawlTopic(topic: string): Promise<void> {
    if (!this.manager) {
      throw new Error("Crawler not initialized");
    }

    const result = await this.manager.expandKnowledge(topic, "manual");
    console.log(`✅ Manual crawl: ${topic} - ${result.newlyApprovedKnowledge.length} items`);
  }

  /**
   * Get current progress
   */
  getProgress() {
    if (!this.tracker) {
      return null;
    }

    return this.tracker.getProgressState();
  }

  /**
   * Get progress summary
   */
  getProgressSummary() {
    if (!this.tracker) {
      return null;
    }

    return this.tracker.getSummary();
  }

  /**
   * Switch mode
   */
  setMode(mode: "learning" | "on_demand"): void {
    this.config.mode = mode;

    if (this.tracker) {
      this.tracker.setMode(mode);
    }

    if (mode === "learning" && !this.isRunning) {
      this.start();
    } else if (mode === "on_demand" && this.isRunning) {
      this.stop();
    }

    console.log(`🔄 Switched to ${mode} mode`);
  }

  /**
   * Get crawler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.config.mode,
      crawlCount: this.crawlCount,
      isInitialized: !!this.manager,
      intervalMs: this.config.crawlIntervalMs,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }
}

// Global instance for app-wide access
let globalCrawler: BackgroundKnowledgeCrawler | null = null;

/**
 * Get or create the global crawler instance
 */
export function getBackgroundCrawler(): BackgroundKnowledgeCrawler {
  if (!globalCrawler) {
    globalCrawler = new BackgroundKnowledgeCrawler({
      enabled: true,
      mode: "learning",
      crawlIntervalMs: 120000, // 2 minutes between batches
      batchSize: 3,
      autoSwitchWhenReady: true,
    });
  }

  return globalCrawler;
}

/**
 * Initialize the global crawler
 */
export function initializeBackgroundCrawler(
  recipes: RecipeCodexMetadata[],
  ingredients: Record<string, any>
): void {
  const crawler = getBackgroundCrawler();
  crawler.initialize(recipes, ingredients);
}

export default BackgroundKnowledgeCrawler;
