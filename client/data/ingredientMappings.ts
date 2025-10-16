// Maps recipe ingredient text strings to canonical inventory items
// Handles common variations, synonyms, and fuzzy matching

import { INVENTORY_ITEMS } from "./inventoryItems";

export type IngredientMapping = {
  recipeText: string;
  inventoryId: string;
  confidence: number; // 0-1, where 1 is exact match
  notes?: string;
};

// Exact mappings: recipe text → inventory item ID
// These are manually curated for high confidence matches
const EXACT_MAPPINGS: IngredientMapping[] = [
  { recipeText: "heirloom carrots, peeled", inventoryId: "ing-heirloom-carrot", confidence: 1.0 },
  { recipeText: "heirloom carrots", inventoryId: "ing-heirloom-carrot", confidence: 0.95 },
  { recipeText: "carrots, peeled", inventoryId: "ing-heirloom-carrot", confidence: 0.85 },
  { recipeText: "whole blanched almonds", inventoryId: "ing-whole-blanched-almonds", confidence: 1.0 },
  { recipeText: "almonds, blanched", inventoryId: "ing-whole-blanched-almonds", confidence: 0.95 },
  { recipeText: "prime beef short rib, boneless", inventoryId: "ing-beef-short-rib", confidence: 1.0 },
  { recipeText: "beef short rib", inventoryId: "ing-beef-short-rib", confidence: 0.9 },
  { recipeText: "short rib", inventoryId: "ing-beef-short-rib", confidence: 0.8 },
  { recipeText: "beef tallow", inventoryId: "ing-beef-tallow", confidence: 1.0 },
  { recipeText: "tallow", inventoryId: "ing-beef-tallow", confidence: 0.95 },
  { recipeText: "fresh garlic cloves, jumbo", inventoryId: "ing-fresh-garlic-cloves", confidence: 1.0 },
  { recipeText: "garlic cloves", inventoryId: "ing-fresh-garlic-cloves", confidence: 0.95 },
  { recipeText: "garlic", inventoryId: "ing-fresh-garlic-cloves", confidence: 0.8 },
  { recipeText: "organic coconut milk", inventoryId: "ing-organic-coconut-milk", confidence: 1.0 },
  { recipeText: "coconut milk", inventoryId: "ing-organic-coconut-milk", confidence: 0.95 },
  { recipeText: "agar powder", inventoryId: "ing-agar-powder", confidence: 1.0 },
  { recipeText: "agar", inventoryId: "ing-agar-powder", confidence: 0.95 },
  { recipeText: "madagascar vanilla bean paste", inventoryId: "ing-vanilla-bean-paste", confidence: 1.0 },
  { recipeText: "vanilla bean paste", inventoryId: "ing-vanilla-bean-paste", confidence: 0.95 },
  { recipeText: "vanilla paste", inventoryId: "ing-vanilla-bean-paste", confidence: 0.9 },
  { recipeText: "fermented calabrian chili puree", inventoryId: "ing-calabrian-chili", confidence: 1.0 },
  { recipeText: "calabrian chili", inventoryId: "ing-calabrian-chili", confidence: 0.95 },
  { recipeText: "chili puree", inventoryId: "ing-calabrian-chili", confidence: 0.8 },
  { recipeText: "wildflower honey, raw", inventoryId: "ing-wildflower-honey", confidence: 1.0 },
  { recipeText: "wildflower honey", inventoryId: "ing-wildflower-honey", confidence: 0.95 },
  { recipeText: "raw honey", inventoryId: "ing-wildflower-honey", confidence: 0.85 },
  { recipeText: "honey", inventoryId: "ing-wildflower-honey", confidence: 0.7 },
  { recipeText: "mirepoix blend, diced", inventoryId: "ing-mirepoix-blend", confidence: 1.0 },
  { recipeText: "mirepoix", inventoryId: "ing-mirepoix-blend", confidence: 0.95 },
  { recipeText: "fresh meyer lemons", inventoryId: "ing-meyer-lemon", confidence: 1.0 },
  { recipeText: "meyer lemons", inventoryId: "ing-meyer-lemon", confidence: 0.95 },
  { recipeText: "lemons", inventoryId: "ing-meyer-lemon", confidence: 0.7 },
];

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Calculate similarity score (0-1) based on Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

// Find all words in a string that are keywords in inventory items
function findKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const keywords: string[] = [];

  for (const item of INVENTORY_ITEMS) {
    const itemWords = item.canonicalName.toLowerCase().split(/\s+/);
    for (const word of itemWords) {
      if (words.some((w) => w.includes(word) || word.includes(w))) {
        keywords.push(item.id);
        break;
      }
    }
  }

  return Array.from(new Set(keywords));
}

// Main function: Map recipe ingredient text to inventory item
export function mapIngredientToInventory(recipeText: string): IngredientMapping | null {
  const normalizedText = recipeText.toLowerCase().trim();

  // 1. Try exact matching first
  const exactMatch = EXACT_MAPPINGS.find(
    (m) => m.recipeText.toLowerCase() === normalizedText,
  );
  if (exactMatch) return exactMatch;

  // 2. Try case-insensitive partial matching
  const partialMatch = EXACT_MAPPINGS.find(
    (m) => normalizedText.includes(m.recipeText.toLowerCase()) ||
           m.recipeText.toLowerCase().includes(normalizedText),
  );
  if (partialMatch && partialMatch.confidence >= 0.8) {
    return {
      ...partialMatch,
      confidence: Math.min(partialMatch.confidence, 0.85),
    };
  }

  // 3. Fuzzy match against canonical names
  let bestMatch: { inventoryId: string; similarity: number } | null = null;
  for (const item of INVENTORY_ITEMS) {
    const similarity = calculateSimilarity(recipeText, item.canonicalName);
    if (similarity > 0.6) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { inventoryId: item.id, similarity };
      }
    }
  }

  if (bestMatch && bestMatch.similarity > 0.7) {
    return {
      recipeText,
      inventoryId: bestMatch.inventoryId,
      confidence: bestMatch.similarity,
      notes: "Fuzzy matched",
    };
  }

  // 4. Try keyword matching
  const keywords = findKeywords(recipeText);
  if (keywords.length > 0) {
    return {
      recipeText,
      inventoryId: keywords[0],
      confidence: 0.5,
      notes: "Matched by keyword",
    };
  }

  return null;
}

// Batch mapping for multiple ingredients
export function mapIngredientsToInventory(
  recipeTexts: string[],
): Map<string, IngredientMapping> {
  const results = new Map<string, IngredientMapping>();
  for (const text of recipeTexts) {
    const mapping = mapIngredientToInventory(text);
    if (mapping) {
      results.set(text, mapping);
    }
  }
  return results;
}

// Search inventory items by name
export function searchInventoryItems(
  query: string,
  minConfidence: number = 0.6,
): IngredientMapping[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length === 0) return [];

  const results: IngredientMapping[] = [];

  for (const item of INVENTORY_ITEMS) {
    const similarity = calculateSimilarity(normalizedQuery, item.canonicalName);
    if (similarity >= minConfidence) {
      results.push({
        recipeText: item.canonicalName,
        inventoryId: item.id,
        confidence: similarity,
      });
    }

    // Also check description
    if (item.description) {
      const descSimilarity = calculateSimilarity(normalizedQuery, item.description);
      if (descSimilarity >= minConfidence && descSimilarity > similarity) {
        results.push({
          recipeText: item.description,
          inventoryId: item.id,
          confidence: descSimilarity,
        });
      }
    }
  }

  // Sort by confidence (highest first)
  return results.sort((a, b) => b.confidence - a.confidence);
}

// Get all mapped ingredients (for debugging/admin)
export function getAllMappings(): IngredientMapping[] {
  return EXACT_MAPPINGS;
}

// Add a custom mapping (for user overrides)
const customMappings = new Map<string, string>();

export function setCustomMapping(recipeText: string, inventoryId: string): void {
  customMappings.set(recipeText.toLowerCase(), inventoryId);
}

export function getCustomMapping(recipeText: string): string | undefined {
  return customMappings.get(recipeText.toLowerCase());
}

// Enhanced mapping function that checks custom mappings first
export function mapIngredientWithCustom(recipeText: string): IngredientMapping | null {
  const customId = getCustomMapping(recipeText);
  if (customId) {
    return {
      recipeText,
      inventoryId: customId,
      confidence: 1.0,
      notes: "Custom mapping",
    };
  }
  return mapIngredientToInventory(recipeText);
}
