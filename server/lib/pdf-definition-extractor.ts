/**
 * PDF Definition Extractor
 * Implements the Python scanner's glossary extraction logic in TypeScript
 * Extracts culinary terms and definitions from cookbook PDFs
 */

interface ExtractedDefinition {
  term: string;
  slug: string;
  letter: string;
  definition: string;
  categories: string[];
  aliases: string[];
  source_work: string;
  source_page?: number;
}

const INGREDIENT_KEYWORDS = [
  "herb",
  "spice",
  "salt",
  "pepper",
  "flour",
  "fat",
  "oil",
  "vinegar",
  "cheese",
  "meat",
  "fish",
  "shellfish",
  "bean",
  "grain",
  "rice",
  "fruit",
  "vegetable",
  "nut",
  "seed",
  "sugar",
  "honey",
  "chile",
  "mushroom",
  "wine",
];

const TECHNIQUE_KEYWORDS = [
  "method",
  "technique",
  "process",
  "to cook",
  "to bake",
  "to roast",
  "cooked by",
  "to simmer",
  "to braise",
  "to poach",
  "to sauté",
  "to fry",
  "used to thicken",
  "emulsion",
  "whipped",
  "folded",
  "fermented",
  "ferment",
  "knead",
  "proof",
  "temper",
  "bloom",
];

const EQUIPMENT_KEYWORDS = [
  "pan",
  "skillet",
  "pot",
  "mold",
  "mould",
  "mixer",
  "knife",
  "grill",
  "baking sheet",
  "baking stone",
  "tongs",
  "spatula",
  "whisk",
  "oven",
  "tandoor",
  "griddle",
  "scale",
  "thermometer",
];

const PASTRY_KEYWORDS = [
  "dough",
  "pastry",
  "cream",
  "custard",
  "icing",
  "frosting",
  "batter",
  "sponge",
  "meringue",
  "ganache",
  "laminated",
  "crust",
  "crumb",
];

const BREAD_KEYWORDS = [
  "bread",
  "dough",
  "yeast",
  "fermentation",
  "gluten",
  "crumb",
  "crust",
  "proofing",
  "rise",
];

const WINE_KEYWORDS = [
  "wine",
  "grape",
  "varietal",
  "vineyard",
  "appellation",
  "fortified",
  "liqueur",
  "spirit",
  "beer",
  "ale",
  "lager",
  "cider",
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstLetter(str: string): string {
  for (const char of str) {
    if (/[a-zA-Z]/.test(char)) {
      return char.toUpperCase();
    }
  }
  return "#";
}

function classifyGlossaryEntry(term: string, definition: string): string[] {
  const text = (term + " " + definition).toLowerCase();
  const categories: string[] = [];

  const containsAny = (keywords: string[]) =>
    keywords.some((k) => text.includes(k));

  if (containsAny(INGREDIENT_KEYWORDS)) categories.push("ingredient");
  if (containsAny(TECHNIQUE_KEYWORDS)) categories.push("technique");
  if (containsAny(EQUIPMENT_KEYWORDS)) categories.push("equipment");
  if (containsAny(WINE_KEYWORDS)) categories.push("wine/beverage");
  if (containsAny(PASTRY_KEYWORDS)) categories.push("pastry/baking");
  if (containsAny(BREAD_KEYWORDS)) categories.push("bread");

  return categories.length > 0 ? categories : ["general"];
}

function extractGlossaryEntries(text: string): Array<[string, string]> {
  const lines = text.split("\n");
  const entries: Array<[string, string]> = [];
  const culinaryTermsMap = new Map<string, string[]>();

  const inlinePatterns = [
    /^([A-Z][A-Za-z0-9''()\-/\s]+?)\s{2,}(.+)$/,
    /^([A-Z][A-Za-z0-9''()\-/\s]+?)\s*[:—-]\s+(.+)$/,
  ];

  // First pass: Look for explicit glossary entries
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    let matchedInline = false;
    for (const pattern of inlinePatterns) {
      const m = line.match(pattern);
      if (m) {
        const term = m[1].trim();
        const definition = m[2].trim();

        if (term.length > 2 && term.length < 100 && definition.length > 10) {
          entries.push([term, definition]);
          matchedInline = true;
          break;
        }
      }
    }

    if (matchedInline) continue;

    // Term on one line, definition on next
    if (/^[A-Z][A-Za-z0-9''()\-/\s]+$/.test(line)) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && /^[a-z0-9]/.test(nextLine)) {
          entries.push([line, nextLine]);
        }
      }
    }
  }

  // Second pass: Extract common culinary terms from paragraphs
  // Look for capitalized multi-word phrases that appear with explanatory text
  const paragraphs = text.split(/\n{2,}/);
  const commonCulinaryTerms = [
    "mise en place",
    "bain marie",
    "roux",
    "ganache",
    "emulsion",
    "caramelize",
    "temper chocolate",
    "fold",
    "simmer",
    "whisk",
    "sear",
    "poach",
    "blanch",
    "reduce",
    "deglaze",
    "knead",
    "proof",
    "laminate",
    "macaronage",
    "pate a choux",
    "sabayon",
    "custard",
    "meringue",
    "pate sucree",
    "pate brisee",
    "frangipane",
    "creme anglaise",
    "streusel",
    "simple syrup",
    "brioche",
    "croissant",
    "puff pastry",
    "shortbread",
    "choux",
    "genoise",
    "sponge cake",
    "buttercream",
    "fondant",
    "glaze",
    "coulis",
    "mousse",
    "terrine",
    "consomme",
    "jus",
    "demi-glace",
    "veloute",
    "bechamel",
    "hollandaise",
    "bearnaise",
    "vinaigrette",
  ];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length < 20) continue;

    // Look for culinary terms with explanatory context
    for (const term of commonCulinaryTerms) {
      const termRegex = new RegExp(`\\b${term}\\b`, "gi");
      if (termRegex.test(trimmed)) {
        // Try to find a sentence containing this term
        const sentences = trimmed.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (
            term
              .toLowerCase()
              .includes(sentence.toLowerCase().substring(0, term.length))
          ) {
            const match = sentence.match(
              new RegExp(`(.{0,100}\\b${term}\\b.{0,100})`, "i"),
            );
            if (match && match[1]) {
              const context = match[1].trim();
              if (context.length > term.length + 10) {
                if (!culinaryTermsMap.has(term)) {
                  culinaryTermsMap.set(term, []);
                }
                culinaryTermsMap.get(term)!.push(context);
              }
            }
          }
        }
      }
    }
  }

  // Add extracted culinary terms with their context as "definitions"
  for (const [term, contexts] of culinaryTermsMap) {
    if (contexts.length > 0) {
      const definition = contexts[0]
        .replace(new RegExp(term, "i"), `"${term}"`)
        .substring(0, 150);
      if (definition.length > 10) {
        entries.push([term, definition]);
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique: Array<[string, string]> = [];
  for (const [term, definition] of entries) {
    const key = `${term.toLowerCase()}|${definition.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push([term, definition]);
    }
  }

  return unique;
}

/**
 * Extract all definitions from PDF text (main entry point)
 */
export function extractDefinitionsFromPdfText(
  text: string,
  sourceName: string = "Imported Cookbook",
): ExtractedDefinition[] {
  // Clean text
  text = text.replace(/\r/g, "");
  text = text.replace(/-\n/g, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\n(?=[a-z])/g, " ");
  text = text.replace(/[^\x09-\x0d\x20-\x7e]/g, "");

  // Extract glossary entries
  const entries = extractGlossaryEntries(text);

  // Filter out common false positives
  const filterPatterns = [
    /^(page|contents|index|glossary|appendix|chapter|figure|table|plate|photo|illustration|yield|convert|see|note|tip|warning)/i,
    /^(scan to download|visit us online|qr code)/i,
    /(flexipan|inch|inches|cm|diameter|copyright|isbn|author|published)/i,
  ];

  const definitions = entries
    .filter(([term]) => {
      // Skip very short or very long terms
      if (term.length < 2 || term.length > 150) return false;

      // Skip common false positives
      for (const pattern of filterPatterns) {
        if (pattern.test(term)) return false;
      }

      return true;
    })
    .map(([term, definition]) => {
      const categories = classifyGlossaryEntry(term, definition);

      return {
        term,
        slug: slugify(term),
        letter: firstLetter(term),
        definition,
        categories,
        aliases: [],
        source_work: sourceName,
      };
    })
    .slice(0, 500); // Limit to prevent overload

  return definitions;
}

/**
 * Format definitions for Builder.io upload
 */
export function formatDefinitionsForBuilder(
  definitions: ExtractedDefinition[],
): Array<{
  term: string;
  slug: string;
  letter: string;
  definition: string;
  categories: string[];
  aliases: string[];
  source_work: string;
  source_page?: number;
  status: string;
}> {
  return definitions.map((def) => ({
    ...def,
    status: "auto-imported",
    updated_at: new Date().toISOString(),
  }));
}
