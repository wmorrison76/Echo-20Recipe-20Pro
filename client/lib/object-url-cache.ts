/**
 * LRU Cache for Object URLs
 * ========================
 * Prevents WebKitBlobResource exhaustion by limiting the number of
 * simultaneously active object URLs and automatically revoking older ones
 *
 * For crawlers/bulk operations: use maxSize 50-75
 * For normal gallery use: use maxSize 100-150
 */

interface CacheEntry {
  url: string;
  lastAccessed: number;
  accessCount: number;
}

export class ObjectURLLRUCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly debug: boolean;
  private readonly evictionThreshold: number; // Trigger eviction before full

  constructor(maxSize: number = 100, debug: boolean = false) {
    this.maxSize = maxSize;
    this.debug = debug;
    // Evict when 85% full to prevent hitting hard limit
    this.evictionThreshold = Math.floor(maxSize * 0.85);
  }

  /**
   * Get a URL from cache, updating its access time
   */
  get(id: string): string | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    // Update access time to mark as recently used
    entry.lastAccessed = Date.now();
    return entry.url;
  }

  /**
   * Set a URL in cache, evicting LRU entries if needed
   */
  set(id: string, blob: Blob): string {
    // Revoke old URL if exists
    const existing = this.cache.get(id);
    if (existing) {
      URL.revokeObjectURL(existing.url);
    }

    // Create new object URL
    const url = URL.createObjectURL(blob);

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Store in cache
    this.cache.set(id, {
      url,
      lastAccessed: Date.now(),
    });

    if (this.debug) {
      console.log(
        `[ObjectURLCache] Set ${id}, cache size: ${this.cache.size}/${this.maxSize}`,
      );
    }

    return url;
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let lruId: string | null = null;
    let lruTime = Infinity;

    // Find the least recently used entry
    for (const [id, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruId = id;
      }
    }

    if (lruId) {
      const entry = this.cache.get(lruId)!;
      URL.revokeObjectURL(entry.url);
      this.cache.delete(lruId);

      if (this.debug) {
        console.log(`[ObjectURLCache] Evicted LRU entry: ${lruId}`);
      }
    }
  }

  /**
   * Remove specific entry and revoke its URL
   */
  remove(id: string): void {
    const entry = this.cache.get(id);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.cache.delete(id);

      if (this.debug) {
        console.log(`[ObjectURLCache] Removed ${id}, cache size: ${this.cache.size}`);
      }
    }
  }

  /**
   * Clear all entries and revoke all URLs
   */
  clear(): void {
    for (const [, entry] of this.cache.entries()) {
      URL.revokeObjectURL(entry.url);
    }
    this.cache.clear();

    if (this.debug) {
      console.log("[ObjectURLCache] Cleared all entries");
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    currentSize: number;
    maxSize: number;
    utilizationPercent: number;
  } {
    return {
      currentSize: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
    };
  }

  /**
   * Warn if cache utilization is high
   */
  checkUtilization(): void {
    const utilization = (this.cache.size / this.maxSize) * 100;
    if (utilization > 80) {
      console.warn(
        `[ObjectURLCache] High utilization: ${Math.round(utilization)}% (${this.cache.size}/${this.maxSize})`,
      );
    }
  }
}

// Export singleton instance for global use
export const objectURLCache = new ObjectURLLRUCache(200, false);
