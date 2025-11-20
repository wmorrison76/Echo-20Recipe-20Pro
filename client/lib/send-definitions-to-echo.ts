interface ExtractedDefinition {
  term: string;
  definition: string;
  category?: string;
  page?: number;
}

interface SendDefinitionsResult {
  success: number;
  failed: number;
  terms: Array<{
    term: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Send extracted culinary definitions to Echo knowledge base via Pinecone
 * This allows Echo AI to learn definitions from imported cookbooks
 */
export async function sendDefinitionsToEcho(
  definitions: ExtractedDefinition[],
  bookName: string,
): Promise<SendDefinitionsResult> {
  if (!definitions || definitions.length === 0) {
    return {
      success: 0,
      failed: 0,
      terms: [],
    };
  }

  try {
    const response = await fetch("/api/echo-training/store-definitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        definitions,
        bookName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to send definitions to Echo: ${error}`);
      return {
        success: 0,
        failed: definitions.length,
        terms: definitions.map((d) => ({
          term: d.term,
          success: false,
          error: error,
        })),
      };
    }

    const result = await response.json();
    return result as SendDefinitionsResult;
  } catch (error) {
    console.error("Error sending definitions to Echo:", error);
    return {
      success: 0,
      failed: definitions.length,
      terms: definitions.map((d) => ({
        term: d.term,
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      })),
    };
  }
}

/**
 * Extract culinary definitions from text using regex patterns
 * Looks for term: definition patterns, bulleted definitions, and common culinary terms
 */
export function extractDefinitionsFromText(
  text: string,
  page?: number,
): ExtractedDefinition[] {
  const definitions: ExtractedDefinition[] = [];
  const lines = text.split("\n");

  // Common culinary technique categories
  const categories: Record<string, string> = {
    technique: "Technique",
    ingredient: "Ingredient",
    equipment: "Equipment",
    method: "Method",
    style: "Cooking Style",
    preparation: "Preparation",
  };

  // Pattern 1: "Term: Definition" or "Term - Definition"
  const definitionPatterns = [
    /^([A-Z][A-Za-z\s]{2,50}?):\s*(.{10,200}?)$/gm,
    /^([A-Z][A-Za-z\s]{2,50}?)\s*[-–—]\s*(.{10,200}?)$/gm,
    /^\*\*?([A-Z][A-Za-z\s]{2,50}?)\*\*?:\s*(.{10,200}?)$/gm,
  ];

  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = match[1].trim();
      const definition = match[2].trim();

      // Filter out common false positives
      if (
        !shouldFilterTerm(term) &&
        definition.length > 10 &&
        !definitions.some((d) => d.term.toLowerCase() === term.toLowerCase())
      ) {
        definitions.push({
          term,
          definition,
          page,
        });
      }
    }
  }

  // Pattern 2: Bullet-pointed definitions
  const bulletPattern = /^[-•*]\s+([A-Z][A-Za-z\s]{2,50}?):\s*(.{10,200}?)$/gm;
  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    const term = match[1].trim();
    const definition = match[2].trim();

    if (
      !shouldFilterTerm(term) &&
      definition.length > 10 &&
      !definitions.some((d) => d.term.toLowerCase() === term.toLowerCase())
    ) {
      definitions.push({
        term,
        definition,
        page,
      });
    }
  }

  // Pattern 3: Common culinary terms with context
  const culinaryTerms = [
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
    "choux",
    "soufle",
    "souffle",
    "espagnole",
    "veloute",
    "bechamel",
    "hollandaise",
    "béarnaise",
    "brunoise",
    "julienne",
    "chiffonade",
    "concasse",
    "quenelle",
    "pluche",
    "chiffonade",
    "lardons",
    "bouquet garni",
  ];

  for (const term of culinaryTerms) {
    const regex = new RegExp(
      `\\b${term.replace(/\s+/g, "\\s+")}\\b.*?[.!?]`,
      "gi",
    );
    const matches = text.match(regex);

    if (
      matches &&
      !definitions.some((d) => d.term.toLowerCase() === term.toLowerCase())
    ) {
      const definition = matches[0]
        .replace(new RegExp(`\\b${term}\\b`, "gi"), "")
        .trim();

      if (definition.length > 10) {
        definitions.push({
          term: capitalizeWords(term),
          definition,
          category: "Technique",
          page,
        });
      }
    }
  }

  return definitions.slice(0, 50); // Limit to prevent overload
}

/**
 * Filter out terms that are likely false positives
 */
function shouldFilterTerm(term: string): boolean {
  const filters = [
    /^(page|contents|index|glossary|appendix|chapter|figure|table|plate|photo|illustration|yield|convert|see|note|tip|warning)/i,
    /^(scan to download|visit us online|qr code)/i,
    /(flexipan|inch|inches|cm|diameter|copyright|isbn|author|published)/i,
    /^[0-9]+$/,
    term.length < 3,
  ];

  return filters.some((filter) =>
    filter instanceof RegExp ? filter.test(term) : filter,
  );
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
