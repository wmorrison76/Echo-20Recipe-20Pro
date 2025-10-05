import { useMemo } from "react";

type Dimension = "mass" | "volume" | "count";

type BaseUnitResult = {
  value: number;
  unit: string;
  dimension: Dimension;
};

type TokenTarget = {
  nameTokens: string[];
  descriptorTokens: string[];
  prepTokens: string[];
  categories: string[];
};

type BaseYieldRule = {
  id: string;
  percent: number;
  reason: string;
  ingredientTokens?: string[];
  descriptorTokens?: string[];
  prepTokens?: string[];
  category?: string;
  priority?: number;
};

type BaseYieldMatch = {
  percent: number | null;
  reason: string | null;
  ruleId: string | null;
};

type IntegratedYieldResult = {
  percent: number | null;
  source: IngredientYieldSource;
};

type IngredientYieldSource = "none" | "base" | "chef" | "combined";

type NormalizedIngredient = {
  baseName: string;
  tokens: string[];
  descriptors: string[];
  descriptorTokens: string[];
  categories: string[];
  key: string;
};

type ChefYieldMatch = {
  percent: number;
  method: string;
  note?: string;
  recordId: string;
  recordedAt: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "fresh",
  "large",
  "small",
  "medium",
  "organic",
  "local",
  "farm",
  "heirloom",
  "baby",
  "wild",
  "whole",
  "ripe",
  "the",
  "of",
  "new",
  "young",
  "heritage",
  "super",
  "extra",
  "grade",
  "jumbo",
  "frozen",
  "raw",
  "cooked",
]);

const IRREGULAR_SINGULARS: Record<string, string> = {
  tomatoes: "tomato",
  potatoes: "potato",
  feet: "foot",
  geese: "goose",
  mice: "mouse",
  lice: "louse",
  knives: "knife",
  loaves: "loaf",
  leaves: "leaf",
  halves: "half",
  wives: "wife",
  lives: "life",
  selves: "self",
  people: "person",
  children: "child",
  oxen: "ox",
  deer: "deer",
};

const INGREDIENT_CATEGORIES: Record<string, string[]> = {
  carrot: ["vegetable", "root"],
  beet: ["vegetable", "root"],
  parsnip: ["vegetable", "root"],
  radish: ["vegetable", "root"],
  turnip: ["vegetable", "root"],
  potato: ["vegetable", "root"],
  rutabaga: ["vegetable", "root"],
  celeriac: ["vegetable", "root"],
  fennel: ["vegetable", "bulb"],
  onion: ["vegetable", "bulb"],
  shallot: ["vegetable", "bulb"],
  garlic: ["vegetable", "bulb"],
  pepper: ["vegetable", "fruit"],
  tomato: ["vegetable", "fruit"],
  squash: ["vegetable", "fruit"],
  zucchini: ["vegetable", "fruit"],
  cucumber: ["vegetable", "fruit"],
  peach: ["fruit", "stone"],
  apricot: ["fruit", "stone"],
  plum: ["fruit", "stone"],
  apple: ["fruit"],
  pear: ["fruit"],
  mango: ["fruit"],
  pineapple: ["fruit"],
  cabbage: ["vegetable", "leaf"],
  kale: ["vegetable", "leaf"],
  lettuce: ["vegetable", "leaf"],
  spinach: ["vegetable", "leaf"],
  chicken: ["protein", "poultry"],
  turkey: ["protein", "poultry"],
  duck: ["protein", "poultry"],
  beef: ["protein", "red"],
  lamb: ["protein", "red"],
  pork: ["protein", "red"],
  salmon: ["protein", "seafood"],
  tuna: ["protein", "seafood"],
  shrimp: ["protein", "seafood"],
  lobster: ["protein", "seafood"],
};

const BASE_YIELD_RULES: BaseYieldRule[] = [
  {
    id: "carrot-peeled",
    percent: 82,
    reason: "Carrot peeled and topped loss",
    ingredientTokens: ["carrot"],
    descriptorTokens: ["peeled"],
    priority: 90,
  },
  {
    id: "root-peeled",
    percent: 84,
    reason: "Root vegetable peel trimming",
    category: "root",
    descriptorTokens: ["peeled"],
    priority: 70,
  },
  {
    id: "root-trimmed",
    percent: 90,
    reason: "Root vegetable trimmed/stemmed",
    category: "root",
    descriptorTokens: ["trimmed", "topped", "top", "stemmed"],
    priority: 60,
  },
  {
    id: "fruit-peeled",
    percent: 80,
    reason: "Fruit peeled",
    category: "fruit",
    descriptorTokens: ["peeled"],
    priority: 50,
  },
  {
    id: "stonefruit-pitted",
    percent: 88,
    reason: "Stone fruit pitted",
    category: "stone",
    descriptorTokens: ["pitted", "halved", "destoned"],
    priority: 60,
  },
  {
    id: "leafy-trimmed",
    percent: 88,
    reason: "Leafy greens trimmed",
    category: "leaf",
    descriptorTokens: ["trimmed", "stemmed"],
    priority: 45,
  },
  {
    id: "bulb-peeled",
    percent: 75,
    reason: "Bulb vegetable peeled",
    category: "bulb",
    descriptorTokens: ["peeled"],
    priority: 55,
  },
  {
    id: "protein-trim",
    percent: 72,
    reason: "Protein trimmed/deboned",
    category: "protein",
    descriptorTokens: ["trimmed", "cleaned", "butchered", "deboned", "skinned"],
    priority: 65,
  },
  {
    id: "generic-peeled",
    percent: 87,
    reason: "General peel loss",
    descriptorTokens: ["peeled"],
    priority: 40,
  },
  {
    id: "generic-seeded",
    percent: 92,
    reason: "Seeds removed",
    descriptorTokens: ["seeded", "deseeded", "seedless"],
    priority: 40,
  },
  {
    id: "generic-trimmed",
    percent: 94,
    reason: "General trim loss",
    descriptorTokens: ["trimmed", "stemmed", "topped", "top"],
    priority: 35,
  },
  {
    id: "generic-cleaned",
    percent: 95,
    reason: "Cleaned and prepped",
    descriptorTokens: ["cleaned", "prepped"],
    priority: 25,
  },
];

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  tsp: 4.92892,
  teaspoon: 4.92892,
  teaspoons: 4.92892,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tablespoons: 14.7868,
  floz: 29.5735,
  "fl oz": 29.5735,
  ounce: 29.5735,
  ounces: 29.5735,
  oz: 29.5735,
  cup: 236.588,
  cups: 236.588,
  pint: 473.176,
  pints: 473.176,
  pt: 473.176,
  quart: 946.353,
  quarts: 946.353,
  qt: 946.353,
  qts: 946.353,
  gallon: 3785.41,
  gallons: 3785.41,
  gal: 3785.41,
};

const MASS_TO_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
};

const COUNT_UNITS = new Set(["each", "ea", "piece", "pieces", "count"]);

function clampPercent(value: number): number {
  return Math.max(0, Math.min(9999, value));
}

function singularize(value: string): string {
  if (!value) return value;
  if (IRREGULAR_SINGULARS[value]) return IRREGULAR_SINGULARS[value];
  if (value.endsWith("ies") && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith("ves") && value.length > 3) {
    return `${value.slice(0, -3)}f`;
  }
  if (value.endsWith("oes") && value.length > 3) {
    return value.slice(0, -2);
  }
  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }
  return value;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => singularize(token.trim()))
    .filter((token) => token && !STOP_WORDS.has(token));
}

function parseIngredient(value: string): NormalizedIngredient {
  const normalized = String(value || "");
  const descriptors: string[] = [];
  let base = normalized.replace(/\(([^)]+)\)/g, (_, inner: string) => {
    descriptors.push(inner);
    return "";
  });
  base = base.split(/[–—-]/)[0] ?? base;
  base = base.split(",")[0] ?? base;

  const descriptorParts = normalized
    .split(/[(),]/)
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean);
  descriptors.push(...descriptorParts);

  const baseTokens = tokenize(base);
  const descriptorTokens = Array.from(
    new Set(descriptors.flatMap((part) => tokenize(part))),
  );

  const baseName = baseTokens.join(" ") || base.trim().toLowerCase();
  const categories = Array.from(
    new Set(
      baseTokens.flatMap((token) => INGREDIENT_CATEGORIES[token] ?? []),
    ),
  );
  const key = [...baseTokens, ...descriptorTokens]
    .filter(Boolean)
    .slice(0, 5)
    .join("-");

  return {
    baseName,
    tokens: baseTokens,
    descriptors,
    descriptorTokens,
    categories,
    key,
  };
}

function buildTarget(item: string, prep?: string): TokenTarget {
  const normalized = parseIngredient(item);
  const prepTokens = prep ? tokenize(prep) : [];
  return {
    nameTokens: normalized.tokens,
    descriptorTokens: Array.from(
      new Set([...normalized.descriptorTokens, ...prepTokens]),
    ),
    prepTokens,
    categories: normalized.categories,
  };
}

function matchesRule(rule: BaseYieldRule, target: TokenTarget): number {
  let score = 0;
  if (rule.ingredientTokens?.length) {
    const hasIngredient = rule.ingredientTokens.some((token) =>
      target.nameTokens.includes(token),
    );
    if (!hasIngredient) return 0;
    score += 5;
  }
  if (rule.category) {
    if (!target.categories.includes(rule.category)) return 0;
    score += 3;
  }
  if (rule.descriptorTokens?.length) {
    const hasDescriptor = rule.descriptorTokens.some((token) =>
      target.descriptorTokens.includes(token),
    );
    if (!hasDescriptor) return 0;
    score += 2;
  }
  if (rule.prepTokens?.length) {
    const prepMatch = rule.prepTokens.some((token) =>
      target.prepTokens.includes(token),
    );
    if (!prepMatch) return 0;
    score += 2;
  }
  score += rule.priority ?? 0;
  return score;
}

export function computeBaseYield(item: string, prep?: string): BaseYieldMatch {
  const target = buildTarget(item, prep);
  let bestScore = 0;
  let bestRule: BaseYieldRule | null = null;
  for (const rule of BASE_YIELD_RULES) {
    const score = matchesRule(rule, target);
    if (score > bestScore) {
      bestRule = rule;
      bestScore = score;
    }
  }
  if (!bestRule) {
    return { percent: null, reason: null, ruleId: null };
  }
  return {
    percent: bestRule.percent,
    reason: bestRule.reason,
    ruleId: bestRule.id,
  };
}

export function combineYields(
  base: number | null,
  chef: number | null,
): IntegratedYieldResult {
  if (base == null && chef == null)
    return { percent: null, source: "none" };
  if (base == null) return { percent: chef, source: "chef" };
  if (chef == null) return { percent: base, source: "base" };
  const combined = clampPercent((base / 100) * (chef / 100) * 100);
  return { percent: combined, source: "combined" };
}

export function formatYieldPercent(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}

export function normalizeUnit(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function convertToBaseUnit(
  qty: number,
  unit: string,
): BaseUnitResult | null {
  if (!Number.isFinite(qty) || qty < 0) return null;
  const key = normalizeUnit(unit);
  if (VOLUME_TO_ML[key] != null) {
    return { value: qty * VOLUME_TO_ML[key], unit: "ml", dimension: "volume" };
  }
  if (MASS_TO_G[key] != null) {
    return { value: qty * MASS_TO_G[key], unit: "g", dimension: "mass" };
  }
  if (COUNT_UNITS.has(key)) {
    return { value: qty, unit: "each", dimension: "count" };
  }
  return null;
}

export function areCompatibleUnits(a: string, b: string): boolean {
  const convA = convertToBaseUnit(1, a);
  const convB = convertToBaseUnit(1, b);
  if (!convA || !convB) return false;
  return convA.dimension === convB.dimension;
}

export function computeYieldPercent(
  inputQty: number,
  inputUnit: string,
  outputQty: number,
  outputUnit: string,
): number | null {
  const input = convertToBaseUnit(inputQty, inputUnit);
  const output = convertToBaseUnit(outputQty, outputUnit);
  if (!input || !output) return null;
  if (input.dimension !== output.dimension) return null;
  if (input.value === 0) return null;
  return clampPercent((output.value / input.value) * 100);
}

export function createIngredientKey(value: string): string {
  return parseIngredient(value).key;
}

export function extractIngredientMetadata(item: string) {
  return parseIngredient(item);
}

export function createPrepKey(value: string): string {
  return tokenize(value).slice(0, 4).join("-");
}

export function createMethodKey(value: string): string {
  return tokenize(value).slice(0, 6).join("-");
}

export function collectPrepTokens(item: string, prep?: string): string[] {
  const meta = parseIngredient(item);
  const prepTokens = prep ? tokenize(prep) : [];
  return Array.from(new Set([...meta.descriptorTokens, ...prepTokens]));
}

export function useBaseYieldDiagnostics(item: string, prep: string) {
  return useMemo(() => computeBaseYield(item, prep), [item, prep]);
}

export type {
  BaseYieldMatch,
  ChefYieldMatch,
  IntegratedYieldResult,
  IngredientYieldSource,
  NormalizedIngredient,
};
