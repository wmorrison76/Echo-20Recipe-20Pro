import type { Request, Response } from 'express';

// Very small nutrition dictionary per 100g. Values approximate and for demo purposes.
const NUTRITION_DB: Record<string, { kcal: number; fat: number; carbs: number; protein: number }> = {
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
  g: 1, gram: 1, grams: 1,
  kg: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  ml: 1, milliliter: 1, milliliters: 1, // density=water fallback
  l: 1000, liter: 1000, litres: 1000, liters: 1000,
  tsp: 4.2, teaspoon: 4.2, teaspoons: 4.2, teas: 4.2, teaspoonn: 4.2, teaspoonns: 4.2,
  tbsp: 14.3, tablespoon: 14.3, tablespoons: 14.3, tbl: 14.3, tbls: 14.3,
  cup: 240, cups: 240,
};

function parseQtyUnit(line: string) {
  // Extract leading quantity and unit, e.g., "1 1/2 cup sugar" or "2oz butter"
  let qty = 0; let unit = '';
  const m = line.trim().match(/^([0-9]+(?:\.[0-9]+)?(?:\s+[0-9]+\/[0-9]+)?)\s*([a-zA-Z]+)?/);
  if (m) {
    const raw = m[1];
    // Handle mixed fraction like "1 1/2"
    const parts = raw.split(' ');
    if (parts.length === 2 && /\d+\/\d+/.test(parts[1])) {
      const [n, d] = parts[1].split('/').map(Number);
      qty = Number(parts[0]) + (d ? n / d : 0);
    } else if (/\d+\/\d+/.test(raw)) {
      const [n, d] = raw.split('/').map(Number); qty = d ? n / d : Number(n);
    } else qty = Number(raw);
    unit = (m[2] || '').toLowerCase();
  }
  return { qty, unit };
}

function normalizeItemName(s: string) {
  const t = s.toLowerCase();
  const map: [RegExp, string][] = [
    [/all[-\s]?purpose flour|ap flour|flour/, 'flour'],
    [/granulated sugar|caster sugar|sugar/, 'sugar'],
    [/unsalted butter|butter/, 'butter'],
    [/egg(s)?\b|whole egg/, 'egg'],
    [/whole milk|milk/, 'milk'],
    [/olive oil|extra virgin olive oil|oil/, 'olive_oil'],
    [/cheddar|mozzarella|parmesan|cheese/, 'cheese'],
    [/heavy cream|double cream|cream/, 'cream'],
    [/shrimp|prawn/, 'shrimp'],
    [/beef/, 'beef'],
    [/chicken/, 'chicken'],
    [/tomato/, 'tomato'],
    [/onion/, 'onion'],
    [/garlic/, 'garlic'],
    [/carrot/, 'carrot'],
    [/potato/, 'potato'],
    [/fish|salmon|tuna|cod|trout|halibut/, 'fish'],
    [/almond|almonds/, 'almond'],
    [/salt|kosher salt|sea salt/, 'salt'],
  ];
  for (const [re, k] of map) if (re.test(t)) return k;
  return '';
}

export async function handleNutritionAnalyze(req: Request, res: Response) {
  try {
    const { ingr, yields = [], yieldQty = 1, yieldUnit = 'SERVING' } = req.body as { ingr: string[]; yields?: (number|null)[]; yieldQty?: number; yieldUnit?: string };
    if (!Array.isArray(ingr) || !ingr.length) return res.status(400).json({ error: 'No ingredients provided' });

    let totalG = 0;
    let kcal = 0, fat = 0, carbs = 0, protein = 0;
    const breakdown: any[] = [];

    // Approximate fallback yield by prep method keywords
    const prepText = (req.body.prepMethod || '').toString().toLowerCase();
    const fallbackYield = /fried|grill|roast|bake/.test(prepText) ? 0.88 : /poach|boil|simmer|stew/.test(prepText) ? 0.95 : 0.92;

    for (let i=0;i<ingr.length;i++) {
      const line = ingr[i];
      const { qty, unit } = parseQtyUnit(line);
      const gramsRaw = qty * (UNIT_TO_G[unit as keyof typeof UNIT_TO_G] || 0);
      const itemName = normalizeItemName(line);
      let y = yields[i];
      if (typeof y !== 'number' || !(y>=0)) y = undefined as any;
      // Salt/spices no loss
      let factor = 1;
      if (itemName && /salt/.test(itemName)) factor = 1;
      else factor = typeof y === 'number' ? Math.max(0, Math.min(1, y/100)) : fallbackYield;
      const grams = gramsRaw * factor;

      totalG += grams;
      const nut = itemName ? NUTRITION_DB[itemName] : undefined;
      if (nut && grams > 0) {
        const f = grams / 100;
        const add = { item: itemName, grams, kcal: nut.kcal * f, fat: nut.fat * f, carbs: nut.carbs * f, protein: nut.protein * f };
        breakdown.push(add);
        kcal += add.kcal; fat += add.fat; carbs += add.carbs; protein += add.protein;
      } else {
        breakdown.push({ item: itemName || 'unknown', grams, kcal: 0, fat: 0, carbs: 0, protein: 0 });
      }
    }

    const data = {
      calories: Math.max(0, Math.round(kcal)),
      totalNutrients: {
        ENERC_KCAL: { label: 'Energy', quantity: Math.max(0, kcal), unit: 'kcal' },
        FAT: { label: 'Fat', quantity: Math.max(0, fat), unit: 'g' },
        CHOCDF: { label: 'Carbs', quantity: Math.max(0, carbs), unit: 'g' },
        PROCNT: { label: 'Protein', quantity: Math.max(0, protein), unit: 'g' },
      },
      totalWeight: totalG,
      yieldQty,
      yieldUnit,
      breakdown,
    };

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Nutrition analysis failed' });
  }
}
