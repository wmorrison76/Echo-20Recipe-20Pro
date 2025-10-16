// Master inventory catalog - maps supplier SKUs to canonical ingredient items
// This serves as the single source of truth for ingredient costing and usage

export type SupplierCatalogLink = {
  supplierId: string;
  supplierName: string;
  sku: string;
  packSize: number;
  packUnit: string;
  pricePerPack: number;
  currency: string;
  leadTimeDays: number;
};

export type CostHistoryEntry = {
  date: number;
  supplierId: string;
  supplierName: string;
  costPerUnit: number;
  source: "order" | "quote" | "catalog";
};

export type RecipeUsage = {
  recipeId: string;
  recipeTitle: string;
  qty: number;
  unit: string;
};

export type InventoryItem = {
  id: string;
  canonicalName: string;
  description?: string;
  category: "protein" | "vegetable" | "fruit" | "dairy" | "pantry" | "spice" | "other";
  primaryUnit: string;
  
  // Supplier sources (prefer first one in list as primary)
  supplierLinks: SupplierCatalogLink[];
  
  // Cost tracking
  costHistory: CostHistoryEntry[];
  lastOrderDate?: number;
  
  // Inventory tracking (optional, can be enhanced later)
  currentStock?: number;
  reorderPoint?: number;
  
  // Usage tracking
  usedInRecipes?: RecipeUsage[];
};

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "ing-heirloom-carrot",
    canonicalName: "Heirloom carrots, peeled",
    description: "Mixed heirloom carrots, pre-peeled",
    category: "vegetable",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        sku: "HK-ROOT-004",
        packSize: 5,
        packUnit: "lb",
        pricePerPack: 18.5,
        currency: "USD",
        leadTimeDays: 2,
      },
      {
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        sku: "CP-CARR-008",
        packSize: 10,
        packUnit: "lb",
        pricePerPack: 32.0,
        currency: "USD",
        leadTimeDays: 1,
      },
    ],
    costHistory: [
      {
        date: Date.now() - 30 * 24 * 60 * 60 * 1000,
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        costPerUnit: 3.7,
        source: "order",
      },
      {
        date: Date.now(),
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        costPerUnit: 3.7,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-whole-blanched-almonds",
    canonicalName: "Whole blanched almonds",
    description: "Premium blanched almonds",
    category: "pantry",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        sku: "HK-ALM-102",
        packSize: 2,
        packUnit: "lb",
        pricePerPack: 16.5,
        currency: "USD",
        leadTimeDays: 3,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        costPerUnit: 8.25,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-beef-short-rib",
    canonicalName: "Prime beef short rib, boneless",
    description: "USDA Prime boneless short ribs",
    category: "protein",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-urban-butcher",
        supplierName: "Urban Butcher",
        sku: "UB-BEEF-221",
        packSize: 5,
        packUnit: "lb",
        pricePerPack: 89.5,
        currency: "USD",
        leadTimeDays: 1,
      },
    ],
    costHistory: [
      {
        date: Date.now() - 14 * 24 * 60 * 60 * 1000,
        supplierId: "sup-urban-butcher",
        supplierName: "Urban Butcher",
        costPerUnit: 16.8,
        source: "order",
      },
      {
        date: Date.now(),
        supplierId: "sup-urban-butcher",
        supplierName: "Urban Butcher",
        costPerUnit: 17.9,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-beef-tallow",
    canonicalName: "Rendered beef tallow",
    description: "Pure rendered beef fat",
    category: "pantry",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-urban-butcher",
        supplierName: "Urban Butcher",
        sku: "UB-BEEF-240",
        packSize: 5,
        packUnit: "lb",
        pricePerPack: 22.5,
        currency: "USD",
        leadTimeDays: 2,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-urban-butcher",
        supplierName: "Urban Butcher",
        costPerUnit: 4.5,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-fresh-garlic-cloves",
    canonicalName: "Fresh garlic cloves, jumbo",
    description: "Freshly broken garlic cloves",
    category: "vegetable",
    primaryUnit: "oz",
    supplierLinks: [
      {
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        sku: "CP-GARL-010",
        packSize: 1,
        packUnit: "lb",
        pricePerPack: 4.5,
        currency: "USD",
        leadTimeDays: 1,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        costPerUnit: 0.28,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-organic-coconut-milk",
    canonicalName: "Organic coconut milk, 12x1L",
    description: "Premium organic coconut milk",
    category: "dairy",
    primaryUnit: "case",
    supplierLinks: [
      {
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        sku: "CP-COCO-112",
        packSize: 1,
        packUnit: "case",
        pricePerPack: 28.5,
        currency: "USD",
        leadTimeDays: 2,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        costPerUnit: 28.5,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-agar-powder",
    canonicalName: "Agar powder, pastry grade",
    description: "Food-grade agar stabilizer",
    category: "pantry",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-atelier-patisserie",
        supplierName: "Atelier Patisserie",
        sku: "AP-AGAR-005",
        packSize: 1,
        packUnit: "lb",
        pricePerPack: 22.0,
        currency: "USD",
        leadTimeDays: 4,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-atelier-patisserie",
        supplierName: "Atelier Patisserie",
        costPerUnit: 22.0,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-vanilla-bean-paste",
    canonicalName: "Madagascar vanilla bean paste",
    description: "Premium vanilla bean paste from Madagascar",
    category: "pantry",
    primaryUnit: "oz",
    supplierLinks: [
      {
        supplierId: "sup-atelier-patisserie",
        supplierName: "Atelier Patisserie",
        sku: "AP-VANL-021",
        packSize: 4,
        packUnit: "oz",
        pricePerPack: 32.5,
        currency: "USD",
        leadTimeDays: 5,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-atelier-patisserie",
        supplierName: "Atelier Patisserie",
        costPerUnit: 8.125,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-calabrian-chili",
    canonicalName: "Fermented Calabrian chili puree",
    description: "Traditional Italian fermented chili",
    category: "pantry",
    primaryUnit: "oz",
    supplierLinks: [
      {
        supplierId: "sup-lavilla-preserves",
        supplierName: "LaVilla Preserves",
        sku: "LP-CHIL-207",
        packSize: 8,
        packUnit: "oz",
        pricePerPack: 18.5,
        currency: "USD",
        leadTimeDays: 7,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-lavilla-preserves",
        supplierName: "LaVilla Preserves",
        costPerUnit: 2.3125,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-wildflower-honey",
    canonicalName: "Wildflower honey, raw",
    description: "Raw unpasteurized wildflower honey",
    category: "pantry",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-lavilla-preserves",
        supplierName: "LaVilla Preserves",
        sku: "LP-HONE-032",
        packSize: 3,
        packUnit: "lb",
        pricePerPack: 24.5,
        currency: "USD",
        leadTimeDays: 3,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-lavilla-preserves",
        supplierName: "LaVilla Preserves",
        costPerUnit: 8.17,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-mirepoix-blend",
    canonicalName: "Classic mirepoix blend, diced",
    description: "Pre-diced carrot, celery, onion mix",
    category: "vegetable",
    primaryUnit: "lb",
    supplierLinks: [
      {
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        sku: "HK-MIRE-055",
        packSize: 5,
        packUnit: "lb",
        pricePerPack: 12.5,
        currency: "USD",
        leadTimeDays: 1,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-harvest-kitchens",
        supplierName: "Harvest Kitchens",
        costPerUnit: 2.5,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
  {
    id: "ing-meyer-lemon",
    canonicalName: "Fresh Meyer lemons",
    description: "Sweet Meyer lemons",
    category: "fruit",
    primaryUnit: "each",
    supplierLinks: [
      {
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        sku: "CP-LEMO-041",
        packSize: 25,
        packUnit: "each",
        pricePerPack: 8.5,
        currency: "USD",
        leadTimeDays: 1,
      },
    ],
    costHistory: [
      {
        date: Date.now(),
        supplierId: "sup-coastal-produce",
        supplierName: "Coastal Produce",
        costPerUnit: 0.34,
        source: "catalog",
      },
    ],
    usedInRecipes: [],
  },
];

// Helper: Get inventory item by ID
export function getInventoryItem(id: string): InventoryItem | undefined {
  return INVENTORY_ITEMS.find((item) => item.id === id);
}

// Helper: Get current cost per unit for an item
export function getCurrentCostPerUnit(item: InventoryItem): number | null {
  if (item.costHistory.length === 0) return null;
  const latest = item.costHistory[item.costHistory.length - 1];
  return latest.costPerUnit;
}

// Helper: Get cost variance percentage since last order
export function getCostVariance(item: InventoryItem): number | null {
  if (item.costHistory.length < 2) return null;
  const latest = item.costHistory[item.costHistory.length - 1];
  const previous = item.costHistory[item.costHistory.length - 2];
  const variance = ((latest.costPerUnit - previous.costPerUnit) / previous.costPerUnit) * 100;
  return Math.round(variance * 10) / 10;
}

// Helper: Get total cost for a given quantity
export function calculateCost(item: InventoryItem, qty: number): number | null {
  const costPerUnit = getCurrentCostPerUnit(item);
  return costPerUnit ? qty * costPerUnit : null;
}
