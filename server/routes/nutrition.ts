import type { Request, Response } from "express";

// Very small nutrition dictionary per 100g. Values approximate and for demo purposes.
const NUTRITION_DB: Record<
  string,
  { kcal: number; fat: number; carbs: number; protein: number }
> = {
  flour: { kcal: 364, fat: 1, carbs: 76, protein: 10 },
  sugar: { kcal: 387, fat: 0, carbs: 100, protein: 0 },
  butter: { kcal: 717, fat: 81, carbs: 0, protein: 1 },
  egg: { kcal: 155, fat: 11, carbs: 1.1, protein: 13 },
  milk: { kcal: 42, fat: 1, carbs: 5, protein: 3.4 },
  salt: { kcal: 0, fat: 0, carbs: 0, protein: 0 },
  olive_oil: { kcal: 884, fat: 100, carbs: 0, protein: 0 },
  chicken: { kcal: 239, fat: 14, carbs: 0, protein: 27 },
  beef: { kcal: 250, fat: 15, carbs: 0, protein: 26 },
  rice: { kcal: 130, fat: 0.3, carbs: 28, protein: 2.7 },
  tomato: { kcal: 18, fat: 0.2, carbs: 3.9, protein: 0.9 },
  onion: { kcal: 40, fat: 0.1, carbs: 9.3, protein: 1.1 },
  garlic: { kcal: 149, fat: 0.5, carbs: 33, protein: 6.4 },
  carrot: { kcal: 41, fat: 0.2, carbs: 10, protein: 0.9 },
  potato: { kcal: 77, fat: 0.1, carbs: 17, protein: 2 },
  cheese: { kcal: 402, fat: 33, carbs: 1.3, protein: 25 },
  cream: { kcal: 340, fat: 36, carbs: 3, protein: 2 },
  fish: { kcal: 206, fat: 12, carbs: 0, protein: 22 },
  shrimp: { kcal: 99, fat: 0.3, carbs: 0.2, protein: 24 },
  almond: { kcal: 579, fat: 50, carbs: 22, protein: 21 },
};

const UNIT_TO_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  litres: 1000,
  liters: 1000,
  tsp: 4.2,
  teaspoon: 4.2,
  teaspoons: 4.2,
  "tsp.": 4.2,
  tbsp: 14.3,
  tablespoon: 14.3,
  tablespoons: 14.3,
  "tbsp.": 14.3,
  tbl: 14.3,
  tbls: 14.3,
  cup: 240,
  cups: 240,
  pt: 473.176,
  pint: 473.176,
  pints: 473.176,
  qt: 946.353,
  qts: 946.353,
  quart: 946.353,
  quarts: 946.353,
  gal: 3785.41,
  gallon: 3785.41,
  gallons: 3785.41,
};

function parseQtyUnit(line: string) {
  // Extract leading quantity and unit (supports unicode fractions like ½)
  let qty = 0;
  let unit = "";
  let prep = "";
  const map: Record<string, string> = {
    "¼": "1/4",
    "½": "1/2",
    "¾": "3/4",
    "⅐": "1/7",
    "⅑": "1/9",
    "⅒": "1/10",
    "⅓": "1/3",
    "⅔": "2/3",
    "⅕": "1/5",
    "⅖": "2/5",
    "⅗": "3/5",
    "⅘": "4/5",
    "⅙": "1/6",
    "⅚": "5/6",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
  };
  let t = line.trim().replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (c) => map[c] || c);
  t = t.replace(/(\d)(\s*)(\d\/\d)/, "$1 $3");
  // Match quantity, unit, and the rest of the string (item[, prep])
  const m = t.match(
    /^\s*([0-9]+(?:\.[0-9]+)?(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*([a-zA-Z\.]+)?\s*(.*)$/,
  );
  if (m) {
    const rawQty = m[1];
    const rawUnit = m[2] || "";
    let remaining = m[3].trim();

    // Parse quantity (supports mixed and simple fractions)
    const qtyParts = rawQty.split(" ");
    if (qtyParts.length === 2 && /\d+\/\d+/.test(qtyParts[1])) {
      const [n, d] = qtyParts[1].split("/").map(Number);
      qty = Number(qtyParts[0]) + (d ? n / d : 0);
    } else if (/\d+\/\d+/.test(rawQty)) {
      const [n, d] = rawQty.split("/").map(Number);
      qty = d ? n / d : Number(rawQty);
    } else qty = Number(rawQty);

    unit = (rawUnit || "").toLowerCase();

    // If unit is empty, assume 'each'
    if (!unit && qty > 0) unit = "each";

    // Split item and prep by first comma
    let item = remaining;
    const commaIdx = remaining.indexOf(",");
    if (commaIdx >= 0) {
      item = remaining.slice(0, commaIdx).trim();
      const after = remaining.slice(commaIdx + 1).trim();
      if (after) prep = after.toLowerCase();
    }

    // Handle leading prep like "chopped onion"
    const leadPrep = /^(chopped|diced|minced|sliced|grated|crushed|pureed|melted|softened|cubed|julienned|shredded)\s+(.*)$/i;
    const lp = item.match(leadPrep);
    if (lp) {
      prep = prep || lp[1].toLowerCase();
      item = lp[2].trim();
    }

    return { qty, unit, prep, item };
  }
  // If no quantity/unit found, try to split by comma for prep
  const parts = line.split(",");
  if (parts.length > 1) {
    return { qty: 1, unit: "each", prep: parts.slice(1).join(",").trim().toLowerCase(), item: parts[0].trim() };
  }
  // Treat the whole line as item, assume 1 each
  return { qty: 1, unit: "each", prep: "", item: line.trim() };
}

function normalizeItemName(s: string) {
  const t = s.toLowerCase();
  const map: [RegExp, string][] = [
    [/all[-\s]?purpose flour|ap flour|flour/, "flour"],
    [/granulated sugar|caster sugar|sugar/, "sugar"],
    [/unsalted butter|butter/, "butter"],
    [/egg(s)?\b|whole egg/, "egg"],
    [/whole milk|milk/, "milk"],
    [/olive oil|extra virgin olive oil|oil/, "olive_oil"],
    [/cheddar|mozzarella|parmesan|cheese/, "cheese"],
    [/heavy cream|double cream|cream/, "cream"],
    [/shrimp|prawn/, "shrimp"],
    [/beef/, "beef"],
    [/chicken/, "chicken"],
    [/tomato/, "tomato"],
    [/onion/, "onion"],
    [/garlic/, "garlic"],
    [/carrot/, "carrot"],
    [/potato/, "potato"],
    [/fish|salmon|tuna|cod|trout|halibut/, "fish"],
    [/almond|almonds/, "almond"],
    [/salt|kosher salt|sea salt/, "salt"],
  ];
  for (const [re, k] of map) if (re.test(t)) return k;
  return "";
}

export async function handleNutritionAnalyze(req: Request, res: Response) {
  try {
    const {
      ingr,
      yields = [],
      yieldQty = 1,
      yieldUnit = "SERVING",
    } = req.body as {
      ingr: string[];
      yields?: (number | null)[];
      yieldQty?: number;
      yieldUnit?: string;
    };
    if (!Array.isArray(ingr) || !ingr.length)
      return res.status(400).json({ error: "No ingredients provided" });

    let totalG = 0;
    let kcal = 0,
      fat = 0,
      carbs = 0,
      protein = 0;
    const breakdown: any[] = [];

    // Approximate fallback yield by prep method keywords
    const prepText = (req.body.prepMethod || "").toString().toLowerCase();
    const fallbackYield = /fried|grill|roast|bake/.test(prepText)
      ? 0.88
      : /poach|boil|simmer|stew/.test(prepText)
        ? 0.95
        : 0.92;

    for (let i = 0; i < ingr.length; i++) {
      const line = ingr[i];
      const { qty, unit } = parseQtyUnit(line);
      const gramsRaw = qty * (UNIT_TO_G[unit as keyof typeof UNIT_TO_G] || 0);
      const itemName = normalizeItemName(line);
      let y = yields[i];
      if (typeof y !== "number" || !(y >= 0)) y = undefined as any;
      // Salt/spices no loss
      let factor = 1;
      if (itemName && /salt/.test(itemName)) factor = 1;
      else if (itemName === "onion") factor = typeof y === "number" ? Math.max(0, Math.min(1, y / 100)) : 0.89;
      else
        factor =
          typeof y === "number"
            ? Math.max(0, Math.min(1, y / 100))
            : fallbackYield;
      const grams = gramsRaw * factor;

      totalG += grams;
      const nut = itemName ? NUTRITION_DB[itemName] : undefined;
      if (nut && grams > 0) {
        const f = grams / 100;
        const add = {
          item: itemName,
          grams,
          kcal: nut.kcal * f,
          fat: nut.fat * f,
          carbs: nut.carbs * f,
          protein: nut.protein * f,
        };
        breakdown.push(add);
        kcal += add.kcal;
        fat += add.fat;
        carbs += add.carbs;
        protein += add.protein;
      } else {
        breakdown.push({
          item: itemName || "unknown",
          grams,
          kcal: 0,
          fat: 0,
          carbs: 0,
          protein: 0,
        });
      }
    }

    const data = {
      calories: Math.max(0, Math.round(kcal)),
      totalNutrients: {
        ENERC_KCAL: {
          label: "Energy",
          quantity: Math.max(0, kcal),
          unit: "kcal",
        },
        FAT: { label: "Fat", quantity: Math.max(0, fat), unit: "g" },
        CHOCDF: { label: "Carbs", quantity: Math.max(0, carbs), unit: "g" },
        PROCNT: { label: "Protein", quantity: Math.max(0, protein), unit: "g" },
      },
      totalWeight: totalG,
      yieldQty,
      yieldUnit,
      breakdown,
    };

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Nutrition analysis failed" });
  }
}
