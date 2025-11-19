/**
 * EchoAi³ Knowledge Progress Tracker
 * Monitors knowledge base growth and tracks progress across domains
 */

export type CulinaryType =
  | "general"
  | "pastry"
  | "baking"
  | "banquet"
  | "catering";

export type Region =
  | "chinese"
  | "japanese"
  | "thai"
  | "korean"
  | "indian"
  | "vietnamese"
  | "french"
  | "italian"
  | "spanish"
  | "german"
  | "mexican"
  | "brazilian"
  | "american"
  | "middle_eastern"
  | "african"
  | "oceanic";

export interface CulinaryTypeMetrics {
  type: CulinaryType;
  label: string;
  coverage: number; // 0-100
  itemsApproved: number;
  checkpoints: {
    allergens: boolean;
    nutrition: boolean;
    techniques: boolean;
    flavorBalance: boolean;
    substitutions: boolean;
  };
}

export interface RegionalMetrics {
  region: Region;
  label: string;
  coverage: number; // 0-100
  recipesCount: number;
  cuisinesRepresented: string[];
}

export interface KnowledgeProgressState {
  mode: "learning" | "on_demand";
  totalApprovedItems: number;
  totalRejectedItems: number;
  totalQuarantinedItems: number;
  overallCoverage: number; // 0-100
  culinaryMetrics: CulinaryTypeMetrics[];
  regionalMetrics: RegionalMetrics[];
  lastUpdated: number;
  modeAutoSwitchThresholds: {
    coveragePercentage: number; // e.g., 75
    minApprovedItems: number; // e.g., 10000
  };
  didAutoSwitch: boolean;
  autoSwitchTime?: number;
}

/**
 * Knowledge Progress Tracker
 * Monitors and tracks knowledge base growth
 */
export class KnowledgeProgressTracker {
  private state: KnowledgeProgressState;
  private localStorageKey = "echo_knowledge_progress";

  constructor() {
    this.state = this.loadState() || this.getDefaultState();
  }

  /**
   * Update progress with crawler results
   */
  updateWithCrawlResults(
    approvedCount: number,
    rejectedCount: number,
    quarantinedCount: number,
    metadataByCategory: Record<string, any>,
  ): KnowledgeProgressState {
    this.state.totalApprovedItems += approvedCount;
    this.state.totalRejectedItems += rejectedCount;
    this.state.totalQuarantinedItems += quarantinedCount;

    // Update culinary type metrics
    this.updateCulinaryMetrics(metadataByCategory);

    // Update regional metrics
    this.updateRegionalMetrics(metadataByCategory);

    // Calculate overall coverage
    this.state.overallCoverage = this.calculateOverallCoverage();

    // Check for auto-switch to on-demand mode
    this.checkAutoSwitch();

    // Save state
    this.saveState();

    return this.state;
  }

  /**
   * Update culinary type metrics
   */
  private updateCulinaryMetrics(metadata: Record<string, any>): void {
    const types: CulinaryType[] = [
      "general",
      "pastry",
      "baking",
      "banquet",
      "catering",
    ];

    types.forEach((type) => {
      const metric = this.state.culinaryMetrics.find((m) => m.type === type);
      if (metric) {
        // Count items for this type
        const typeItems = Object.values(metadata).filter((m: any) => {
          const category = m.category || m.type || "";
          return category.toLowerCase().includes(type);
        }).length;

        // Calculate coverage based on checkpoints
        const checkpointsCovered = Object.values(metric.checkpoints).filter(
          (v) => v,
        ).length;
        metric.coverage =
          Math.min(100, typeItems * 5) + checkpointsCovered * 10;
        metric.itemsApproved = typeItems;

        // Update checkpoints based on metadata
        this.updateCheckpoints(metric, metadata);
      }
    });
  }

  /**
   * Update checkpoints for a culinary type
   */
  private updateCheckpoints(
    metric: CulinaryTypeMetrics,
    metadata: Record<string, any>,
  ): void {
    const typeMetadata = Object.values(metadata).filter((m: any) =>
      (m.category || m.type || "").toLowerCase().includes(metric.type),
    );

    if (typeMetadata.length === 0) return;

    // Allergens checkpoint
    metric.checkpoints.allergens = typeMetadata.some(
      (m: any) => m.allergens && m.allergens.length > 0,
    );

    // Nutrition checkpoint
    metric.checkpoints.nutrition = typeMetadata.some((m: any) => m.nutrition);

    // Techniques checkpoint
    metric.checkpoints.techniques = typeMetadata.some(
      (m: any) => m.technique && m.technique.length > 0,
    );

    // Flavor balance checkpoint
    metric.checkpoints.flavorBalance = typeMetadata.some(
      (m: any) => m.flavorBalance,
    );

    // Substitutions checkpoint
    metric.checkpoints.substitutions = typeMetadata.some(
      (m: any) => m.substitutions,
    );
  }

  /**
   * Update regional metrics
   */
  private updateRegionalMetrics(metadata: Record<string, any>): void {
    const regionCuisineMap: Record<Region, string[]> = {
      chinese: ["Chinese", "Cantonese", "Sichuan", "Hunan"],
      japanese: ["Japanese", "Sushi", "Ramen", "Tempura"],
      thai: ["Thai", "Pad Thai", "Tom Yum"],
      korean: ["Korean", "Korean BBQ", "Kimchi"],
      indian: ["Indian", "Curry", "Tandoori", "Naan"],
      vietnamese: ["Vietnamese", "Pho", "Banh Mi"],
      french: ["French", "Haute Cuisine", "French Bistro", "Provence"],
      italian: ["Italian", "Pasta", "Risotto", "Gelato"],
      spanish: ["Spanish", "Tapas", "Paella"],
      german: ["German", "Sausage", "Pretzel"],
      mexican: ["Mexican", "Tacos", "Mole", "Enchiladas"],
      brazilian: ["Brazilian", "Churrasco", "Feijoada"],
      american: ["American", "BBQ", "Burgers", "Southern"],
      middle_eastern: ["Middle Eastern", "Lebanese", "Israeli", "Persian"],
      african: ["African", "Ethiopian", "Moroccan", "West African"],
      oceanic: ["Oceanic", "Australian", "Polynesian", "Hawaiian"],
    };

    Object.entries(regionCuisineMap).forEach(([region, cuisines]) => {
      const metric = this.state.regionalMetrics.find(
        (m) => m.region === (region as Region),
      );
      if (metric) {
        const regionMetadata = Object.values(metadata).filter((m: any) =>
          cuisines.some(
            (cuisine) =>
              (m.cuisineRegion || m.cuisine || "")
                .toLowerCase()
                .includes(cuisine.toLowerCase()) ||
              (m.title || "").toLowerCase().includes(cuisine.toLowerCase()),
          ),
        );

        metric.recipesCount = regionMetadata.length;
        metric.coverage = Math.min(
          100,
          Math.max(0, (regionMetadata.length / 100) * 100),
        );
        metric.cuisinesRepresented = cuisines.filter((c) =>
          regionMetadata.some((m: any) =>
            (m.cuisineRegion || m.cuisine || "")
              .toLowerCase()
              .includes(c.toLowerCase()),
          ),
        );
      }
    });
  }

  /**
   * Calculate overall coverage percentage
   */
  private calculateOverallCoverage(): number {
    const allMetrics = [
      ...this.state.culinaryMetrics,
      ...this.state.regionalMetrics,
    ];

    if (allMetrics.length === 0) return 0;

    const avgCoverage =
      allMetrics.reduce((sum, m) => sum + m.coverage, 0) / allMetrics.length;
    return Math.min(100, Math.round(avgCoverage));
  }

  /**
   * Check if should auto-switch to on-demand mode
   */
  private checkAutoSwitch(): void {
    const {
      totalApprovedItems,
      overallCoverage,
      modeAutoSwitchThresholds,
      mode,
    } = this.state;

    if (mode === "learning") {
      const coverageReached =
        overallCoverage >= modeAutoSwitchThresholds.coveragePercentage;
      const itemsReached =
        totalApprovedItems >= modeAutoSwitchThresholds.minApprovedItems;

      if (coverageReached && itemsReached) {
        this.state.mode = "on_demand";
        this.state.didAutoSwitch = true;
        this.state.autoSwitchTime = Date.now();
      }
    }
  }

  /**
   * Get current progress state
   */
  getProgressState(): KnowledgeProgressState {
    return { ...this.state };
  }

  /**
   * Get progress for specific culinary type
   */
  getCulinaryProgress(type: CulinaryType): CulinaryTypeMetrics | undefined {
    return this.state.culinaryMetrics.find((m) => m.type === type);
  }

  /**
   * Get progress for specific region
   */
  getRegionalProgress(region: Region): RegionalMetrics | undefined {
    return this.state.regionalMetrics.find((m) => m.region === region);
  }

  /**
   * Get mode status
   */
  getMode(): "learning" | "on_demand" {
    return this.state.mode;
  }

  /**
   * Manually switch mode
   */
  setMode(mode: "learning" | "on_demand"): void {
    this.state.mode = mode;
    this.saveState();
  }

  /**
   * Reset progress (for testing)
   */
  reset(): void {
    this.state = this.getDefaultState();
    this.saveState();
  }

  /**
   * Get summary for display
   */
  getSummary(): {
    mode: string;
    coverage: number;
    approved: number;
    progress: string;
    nextThreshold?: string;
  } {
    const coverageToGo = Math.max(
      0,
      this.state.modeAutoSwitchThresholds.coveragePercentage -
        this.state.overallCoverage,
    );
    const itemsToGo = Math.max(
      0,
      this.state.modeAutoSwitchThresholds.minApprovedItems -
        this.state.totalApprovedItems,
    );

    return {
      mode:
        this.state.mode === "learning"
          ? "🚀 Learning Mode"
          : "⚡ On-Demand Mode",
      coverage: this.state.overallCoverage,
      approved: this.state.totalApprovedItems,
      progress: `${this.state.overallCoverage}% coverage, ${this.state.totalApprovedItems.toLocaleString()} items approved`,
      nextThreshold:
        this.state.mode === "learning"
          ? `${coverageToGo.toFixed(0)}% coverage or ${itemsToGo.toLocaleString()} items to auto-switch`
          : undefined,
    };
  }

  /**
   * Helper: Get default state
   */
  private getDefaultState(): KnowledgeProgressState {
    return {
      mode: "learning",
      totalApprovedItems: 0,
      totalRejectedItems: 0,
      totalQuarantinedItems: 0,
      overallCoverage: 0,
      culinaryMetrics: [
        {
          type: "general",
          label: "General Culinary",
          coverage: 0,
          itemsApproved: 0,
          checkpoints: {
            allergens: false,
            nutrition: false,
            techniques: false,
            flavorBalance: false,
            substitutions: false,
          },
        },
        {
          type: "pastry",
          label: "Pastry & Desserts",
          coverage: 0,
          itemsApproved: 0,
          checkpoints: {
            allergens: false,
            nutrition: false,
            techniques: false,
            flavorBalance: false,
            substitutions: false,
          },
        },
        {
          type: "baking",
          label: "Baking & Bread",
          coverage: 0,
          itemsApproved: 0,
          checkpoints: {
            allergens: false,
            nutrition: false,
            techniques: false,
            flavorBalance: false,
            substitutions: false,
          },
        },
        {
          type: "banquet",
          label: "Banquet & Plated",
          coverage: 0,
          itemsApproved: 0,
          checkpoints: {
            allergens: false,
            nutrition: false,
            techniques: false,
            flavorBalance: false,
            substitutions: false,
          },
        },
        {
          type: "catering",
          label: "Catering & Service",
          coverage: 0,
          itemsApproved: 0,
          checkpoints: {
            allergens: false,
            nutrition: false,
            techniques: false,
            flavorBalance: false,
            substitutions: false,
          },
        },
      ],
      regionalMetrics: [
        {
          region: "chinese",
          label: "🇨🇳 Chinese",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "japanese",
          label: "🇯🇵 Japanese",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "thai",
          label: "🇹🇭 Thai",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "korean",
          label: "🇰🇷 Korean",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "indian",
          label: "🇮🇳 Indian",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "vietnamese",
          label: "🇻🇳 Vietnamese",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "french",
          label: "🇫🇷 French",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "italian",
          label: "🇮🇹 Italian",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "spanish",
          label: "🇪🇸 Spanish",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "german",
          label: "🇩🇪 German",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "mexican",
          label: "🇲🇽 Mexican",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "brazilian",
          label: "🇧🇷 Brazilian",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "american",
          label: "🇺🇸 American",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "middle_eastern",
          label: "🌍 Middle Eastern",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "african",
          label: "🌍 African",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
        {
          region: "oceanic",
          label: "🌏 Oceanic",
          coverage: 0,
          recipesCount: 0,
          cuisinesRepresented: [],
        },
      ],
      lastUpdated: Date.now(),
      modeAutoSwitchThresholds: {
        coveragePercentage: 75,
        minApprovedItems: 10000,
      },
      didAutoSwitch: false,
    };
  }

  /**
   * Helper: Save state to localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Failed to save knowledge progress state:", error);
    }
  }

  /**
   * Helper: Load state from localStorage
   */
  private loadState(): KnowledgeProgressState | null {
    try {
      const saved = localStorage.getItem(this.localStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load knowledge progress state:", error);
      return null;
    }
  }
}

export default KnowledgeProgressTracker;
