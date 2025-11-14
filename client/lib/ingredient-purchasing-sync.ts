/**
 * Ingredient Purchasing Sync Utilities
 * Fuzzy search through purchasing inventory, calculate costs, and link to supplier data
 */

import { INVENTORY_ITEMS, InventoryItem } from "@/data/inventoryItems";

export interface IngredientCostMatch {
  inventoryId: string;
  name: string;
  costPerUnit: number;
  packSize: number;
  packUnit: string;
  supplier: string;
  sku: string;
  confidence: number; // 0-1 fuzzy match confidence
}

/**
 * Levenshtein distance for fuzzy matching
 * Returns a score 0-1 where 1 is perfect match
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Fuzzy search ingredients from purchasing inventory
 * Returns matches sorted by confidence
 */
export function searchPurchasingInventory(
  query: string,
  minConfidence: number = 0.6
): IngredientCostMatch[] {
  if (!query.trim()) return [];

  const matches = INVENTORY_ITEMS.map((item) => {
    const confidence = calculateSimilarity(query, item.canonicalName);
    return {
      ...item,
      confidence,
    };
  })
    .filter((item) => item.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
    .map((item) => ({
      inventoryId: item.id,
      name: item.canonicalName,
      costPerUnit: getLatestCostPerUnit(item),
      packSize: item.supplierLinks[0]?.packSize || 1,
      packUnit: item.supplierLinks[0]?.packUnit || item.primaryUnit,
      supplier: item.supplierLinks[0]?.supplierName || "Unknown",
      sku: item.supplierLinks[0]?.sku || "",
      confidence: item.confidence,
    }));

  return matches;
}

/**
 * Get latest cost per unit from inventory item
 * Returns cost per single unit (not per pack)
 */
export function getLatestCostPerUnit(item: InventoryItem): number {
  if (item.supplierLinks.length === 0) return 0;

  const primarySupplier = item.supplierLinks[0];
  const packSize = primarySupplier.packSize || 1;
  const packPrice = primarySupplier.pricePerPack || 0;

  return packPrice / packSize;
}

/**
 * Calculate ingredient cost based on quantity, unit, and yield
 * @param ingredientItem - The inventory item
 * @param qty - Quantity entered by user
 * @param unit - Unit entered by user (e.g., "lb", "cup")
 * @param yieldPercent - Yield percentage from book of yields (0-100)
 * @returns Calculated cost for the ingredient as used
 */
export function calculateIngredientCost(
  ingredientItem: IngredientCostMatch | InventoryItem,
  qty: number,
  unit: string,
  yieldPercent: number = 100
): number {
  if (!ingredientItem || !qty || qty <= 0) return 0;

  // Get cost per unit
  const costPerUnit =
    "costPerUnit" in ingredientItem
      ? ingredientItem.costPerUnit
      : getLatestCostPerUnit(ingredientItem as InventoryItem);

  // Adjust for unit conversion (simplified - assumes metric equivalents)
  let unitMultiplier = 1;
  if (unit.toLowerCase() === "cup") unitMultiplier = 0.24; // 1 cup ≈ 0.24 lb for most ingredients
  if (unit.toLowerCase() === "oz") unitMultiplier = 0.0625; // 1 oz = 0.0625 lb
  if (unit.toLowerCase() === "g") unitMultiplier = 0.0022; // 1g ≈ 0.0022 lb
  if (unit.toLowerCase() === "ml") unitMultiplier = 0.0005; // 1ml ≈ 0.0005 lb for water
  if (unit.toLowerCase() === "pcs" || unit.toLowerCase() === "count") unitMultiplier = 0.5; // Approximate

  const adjustedQty = qty * unitMultiplier;
  const usableQty = (adjustedQty * yieldPercent) / 100;

  return usableQty * costPerUnit;
}

/**
 * Flag missing costs in recipe for audit
 */
export function auditRecipeCosts(
  ingredients: Array<{
    item: string;
    qty: string | number;
    unit: string;
    cost: string | number;
  }>
): {
  total: number;
  missing: number;
  missingItems: string[];
  hasWarnings: boolean;
} {
  const missing: string[] = [];

  ingredients.forEach((ing) => {
    if (!ing.item.trim()) return;
    const cost = typeof ing.cost === "string" ? parseFloat(ing.cost) : ing.cost;
    if (isNaN(cost) || cost === 0) {
      missing.push(`${ing.item} (${ing.qty} ${ing.unit})`);
    }
  });

  return {
    total: ingredients.filter((ing) => ing.item.trim()).length,
    missing: missing.length,
    missingItems: missing,
    hasWarnings: missing.length > 0,
  };
}
