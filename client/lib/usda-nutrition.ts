// USDA FoodData Central API integration
// Uses free public API - no API key required for basic queries
// Reference: https://fdc.nal.usda.gov/api-guide.html

export interface USDAFoodItem {
  fdcId: string;
  description: string;
  dataType: string;
  publishedDate: string;
  foodNutrients: USDANutrient[];
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unit: string;
  value: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat?: number;
  transFat?: number;
  carbohydrates: number;
  fiber?: number;
  sugars?: number;
  sodium?: number;
  cholesterol?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
}

export interface RecipeNutritionBreakdown {
  recipeId: string;
  recipeName: string;
  ingredients: Array<{
    ingredientName: string;
    quantity: number;
    unit: string;
    fdcId?: string;
    nutritionPer100g?: NutritionInfo;
  }>;
  totalNutrition: NutritionInfo;
  perServingNutrition: NutritionInfo;
  servingSize: number;
  servingUnit: string;
  lastUpdated: number;
}

// Nutrient ID mapping (USDA FDC nutrient numbers)
const NUTRIENT_IDS = {
  ENERGY: 1008, // kcal
  PROTEIN: 1003, // g
  TOTAL_LIPID: 1004, // g (Fat)
  CARBOHYDRATE: 1005, // g
  FIBER: 1079, // g (Dietary fiber)
  SUGARS: 2000, // g
  SODIUM: 1093, // mg
  CHOLESTEROL: 1253, // mg
  CALCIUM: 1087, // mg
  IRON: 1089, // mg
  POTASSIUM: 1092, // mg
  VITAMIN_A: 1106, // µg
  VITAMIN_C: 1162, // mg
  VITAMIN_D: 1114, // µg
  VITAMIN_B12: 1168, // µg
  SATURATED_FAT: 1258, // g
  TRANS_FAT: 1257, // g
};

/**
 * Search USDA FoodData Central for food items
 * @param query - Food name or ingredient to search for
 * @param pageSize - Number of results to return (1-200)
 * @returns Promise<USDAFoodItem[]>
 */
export async function searchUSDAFoods(query: string, pageSize: number = 10): Promise<USDAFoodItem[]> {
  try {
    const params = new URLSearchParams({
      query,
      pageSize: Math.min(pageSize, 200).toString(),
      pageNumber: "1",
    });

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.statusText}`);
    }

    const data = await response.json() as { foods: USDAFoodItem[] };
    return data.foods || [];
  } catch (error) {
    console.error("Error searching USDA foods:", error);
    return [];
  }
}

/**
 * Get detailed nutrition information for a specific USDA food item
 * @param fdcId - USDA FDC ID for the food
 * @returns Promise<USDAFoodItem | null>
 */
export async function getUSDAFoodDetails(fdcId: string): Promise<USDAFoodItem | null> {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}`,
    );

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.statusText}`);
    }

    return await response.json() as USDAFoodItem;
  } catch (error) {
    console.error("Error fetching USDA food details:", error);
    return null;
  }
}

/**
 * Extract key nutrition values from USDA nutrient array
 * @param nutrients - Array of USDA nutrients
 * @returns NutritionInfo object with standard nutrition values
 */
export function extractNutritionInfo(nutrients: USDANutrient[]): NutritionInfo {
  const getValue = (nutrientId: number, defaultValue: number = 0) => {
    const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
    return nutrient ? nutrient.value : defaultValue;
  };

  return {
    calories: getValue(NUTRIENT_IDS.ENERGY, 0),
    protein: getValue(NUTRIENT_IDS.PROTEIN, 0),
    fat: getValue(NUTRIENT_IDS.TOTAL_LIPID, 0),
    saturatedFat: getValue(NUTRIENT_IDS.SATURATED_FAT),
    transFat: getValue(NUTRIENT_IDS.TRANS_FAT),
    carbohydrates: getValue(NUTRIENT_IDS.CARBOHYDRATE, 0),
    fiber: getValue(NUTRIENT_IDS.FIBER),
    sugars: getValue(NUTRIENT_IDS.SUGARS),
    sodium: getValue(NUTRIENT_IDS.SODIUM),
    cholesterol: getValue(NUTRIENT_IDS.CHOLESTEROL),
    calcium: getValue(NUTRIENT_IDS.CALCIUM),
    iron: getValue(NUTRIENT_IDS.IRON),
    potassium: getValue(NUTRIENT_IDS.POTASSIUM),
    vitaminA: getValue(NUTRIENT_IDS.VITAMIN_A),
    vitaminC: getValue(NUTRIENT_IDS.VITAMIN_C),
    vitaminD: getValue(NUTRIENT_IDS.VITAMIN_D),
    vitaminB12: getValue(NUTRIENT_IDS.VITAMIN_B12),
  };
}

/**
 * Calculate nutrition per 100g from USDA food data
 * @param foodItem - USDA food item with nutrition data
 * @param servingSize - Serving size in grams
 * @returns NutritionInfo per 100g
 */
export function getNutritionPer100g(foodItem: USDAFoodItem, servingSize?: number): NutritionInfo {
  const nutrition = extractNutritionInfo(foodItem.foodNutrients);

  // If we have serving size, scale to per 100g
  if (servingSize && servingSize > 0) {
    const scale = 100 / servingSize;
    return {
      calories: Math.round(nutrition.calories * scale),
      protein: Math.round(nutrition.protein * scale * 10) / 10,
      fat: Math.round(nutrition.fat * scale * 10) / 10,
      saturatedFat: nutrition.saturatedFat ? Math.round(nutrition.saturatedFat * scale * 10) / 10 : undefined,
      transFat: nutrition.transFat ? Math.round(nutrition.transFat * scale * 10) / 10 : undefined,
      carbohydrates: Math.round(nutrition.carbohydrates * scale * 10) / 10,
      fiber: nutrition.fiber ? Math.round(nutrition.fiber * scale * 10) / 10 : undefined,
      sugars: nutrition.sugars ? Math.round(nutrition.sugars * scale * 10) / 10 : undefined,
      sodium: nutrition.sodium ? Math.round(nutrition.sodium * scale) : undefined,
      cholesterol: nutrition.cholesterol ? Math.round(nutrition.cholesterol * scale) : undefined,
      calcium: nutrition.calcium ? Math.round(nutrition.calcium * scale) : undefined,
      iron: nutrition.iron ? Math.round(nutrition.iron * scale * 10) / 10 : undefined,
      potassium: nutrition.potassium ? Math.round(nutrition.potassium * scale) : undefined,
      vitaminA: nutrition.vitaminA ? Math.round(nutrition.vitaminA * scale) : undefined,
      vitaminC: nutrition.vitaminC ? Math.round(nutrition.vitaminC * scale * 10) / 10 : undefined,
      vitaminD: nutrition.vitaminD ? Math.round(nutrition.vitaminD * scale * 10) / 10 : undefined,
      vitaminB12: nutrition.vitaminB12 ? Math.round(nutrition.vitaminB12 * scale * 10) / 10 : undefined,
    };
  }

  return nutrition;
}

/**
 * Scale nutrition values by a multiplier (e.g., for different quantities)
 * @param nutrition - Base nutrition info
 * @param multiplier - Scaling factor
 * @returns Scaled NutritionInfo
 */
export function scaleNutrition(nutrition: NutritionInfo, multiplier: number): NutritionInfo {
  return {
    calories: Math.round(nutrition.calories * multiplier),
    protein: Math.round(nutrition.protein * multiplier * 10) / 10,
    fat: Math.round(nutrition.fat * multiplier * 10) / 10,
    saturatedFat: nutrition.saturatedFat ? Math.round(nutrition.saturatedFat * multiplier * 10) / 10 : undefined,
    transFat: nutrition.transFat ? Math.round(nutrition.transFat * multiplier * 10) / 10 : undefined,
    carbohydrates: Math.round(nutrition.carbohydrates * multiplier * 10) / 10,
    fiber: nutrition.fiber ? Math.round(nutrition.fiber * multiplier * 10) / 10 : undefined,
    sugars: nutrition.sugars ? Math.round(nutrition.sugars * multiplier * 10) / 10 : undefined,
    sodium: nutrition.sodium ? Math.round(nutrition.sodium * multiplier) : undefined,
    cholesterol: nutrition.cholesterol ? Math.round(nutrition.cholesterol * multiplier) : undefined,
    calcium: nutrition.calcium ? Math.round(nutrition.calcium * multiplier) : undefined,
    iron: nutrition.iron ? Math.round(nutrition.iron * multiplier * 10) / 10 : undefined,
    potassium: nutrition.potassium ? Math.round(nutrition.potassium * multiplier) : undefined,
    vitaminA: nutrition.vitaminA ? Math.round(nutrition.vitaminA * multiplier) : undefined,
    vitaminC: nutrition.vitaminC ? Math.round(nutrition.vitaminC * multiplier * 10) / 10 : undefined,
    vitaminD: nutrition.vitaminD ? Math.round(nutrition.vitaminD * multiplier * 10) / 10 : undefined,
    vitaminB12: nutrition.vitaminB12 ? Math.round(nutrition.vitaminB12 * multiplier * 10) / 10 : undefined,
  };
}

/**
 * Add multiple nutrition values together
 * @param nutritionArray - Array of NutritionInfo objects to sum
 * @returns Combined NutritionInfo
 */
export function combineNutrition(nutritionArray: NutritionInfo[]): NutritionInfo {
  if (nutritionArray.length === 0) {
    return {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
    };
  }

  return {
    calories: Math.round(nutritionArray.reduce((sum, n) => sum + (n.calories || 0), 0)),
    protein: Math.round(nutritionArray.reduce((sum, n) => sum + (n.protein || 0), 0) * 10) / 10,
    fat: Math.round(nutritionArray.reduce((sum, n) => sum + (n.fat || 0), 0) * 10) / 10,
    saturatedFat: Math.round(nutritionArray.reduce((sum, n) => sum + (n.saturatedFat || 0), 0) * 10) / 10 || undefined,
    transFat: Math.round(nutritionArray.reduce((sum, n) => sum + (n.transFat || 0), 0) * 10) / 10 || undefined,
    carbohydrates: Math.round(nutritionArray.reduce((sum, n) => sum + (n.carbohydrates || 0), 0) * 10) / 10,
    fiber: Math.round(nutritionArray.reduce((sum, n) => sum + (n.fiber || 0), 0) * 10) / 10 || undefined,
    sugars: Math.round(nutritionArray.reduce((sum, n) => sum + (n.sugars || 0), 0) * 10) / 10 || undefined,
    sodium: Math.round(nutritionArray.reduce((sum, n) => sum + (n.sodium || 0), 0)) || undefined,
    cholesterol: Math.round(nutritionArray.reduce((sum, n) => sum + (n.cholesterol || 0), 0)) || undefined,
    calcium: Math.round(nutritionArray.reduce((sum, n) => sum + (n.calcium || 0), 0)) || undefined,
    iron: Math.round(nutritionArray.reduce((sum, n) => sum + (n.iron || 0), 0) * 10) / 10 || undefined,
    potassium: Math.round(nutritionArray.reduce((sum, n) => sum + (n.potassium || 0), 0)) || undefined,
    vitaminA: Math.round(nutritionArray.reduce((sum, n) => sum + (n.vitaminA || 0), 0)) || undefined,
    vitaminC: Math.round(nutritionArray.reduce((sum, n) => sum + (n.vitaminC || 0), 0) * 10) / 10 || undefined,
    vitaminD: Math.round(nutritionArray.reduce((sum, n) => sum + (n.vitaminD || 0), 0) * 10) / 10 || undefined,
    vitaminB12: Math.round(nutritionArray.reduce((sum, n) => sum + (n.vitaminB12 || 0), 0) * 10) / 10 || undefined,
  };
}

/**
 * Check if ingredient contains common allergens
 * @param description - Food description from USDA
 * @param ingredients - Ingredients list from USDA
 * @returns Array of detected allergens
 */
export function detectAllergens(description: string, ingredients?: string): string[] {
  const allergenKeywords: Record<string, string[]> = {
    dairy: ["milk", "cheese", "cream", "butter", "lactose", "whey", "casein"],
    eggs: ["egg", "albumin"],
    fish: ["fish", "salmon", "tuna", "anchovy", "cod"],
    crustacean: ["shrimp", "crab", "lobster", "crawfish"],
    "tree nuts": ["almond", "cashew", "walnut", "pecan", "pistachio", "macadamia"],
    peanuts: ["peanut", "groundnut"],
    wheat: ["wheat", "flour", "bread", "cereal"],
    soy: ["soy", "soybean", "tofu", "tempeh"],
    sesame: ["sesame", "tahini"],
  };

  const searchText = `${description} ${ingredients || ""}`.toLowerCase();
  const detected: string[] = [];

  for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
    if (keywords.some((keyword) => searchText.includes(keyword))) {
      detected.push(allergen);
    }
  }

  return detected;
}

// Local cache for USDA searches (to minimize API calls)
const foodCache = new Map<string, USDAFoodItem>();
const maxCacheSize = 100;

/**
 * Search with caching to reduce API calls
 * @param query - Food to search for
 * @param pageSize - Number of results
 * @returns Promise<USDAFoodItem[]>
 */
export async function searchUSDAFoodsCached(query: string, pageSize: number = 10): Promise<USDAFoodItem[]> {
  const cacheKey = `${query}:${pageSize}`;

  // Check cache first
  if (foodCache.has(cacheKey)) {
    return [foodCache.get(cacheKey)!];
  }

  // Fetch from API
  const results = await searchUSDAFoods(query, pageSize);

  // Store first result in cache
  if (results.length > 0) {
    foodCache.set(cacheKey, results[0]);

    // Simple cache size management
    if (foodCache.size > maxCacheSize) {
      const firstKey = foodCache.keys().next().value;
      if (firstKey) {
        foodCache.delete(firstKey);
      }
    }
  }

  return results;
}
