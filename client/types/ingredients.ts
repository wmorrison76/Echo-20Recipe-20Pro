export type IngredientRowType = "ingredient" | "divider";

export type IngredientRow = {
  type: IngredientRowType;
  qty: string;
  unit: string;
  item: string;
  prep: string;
  yield: string;
  cost: string;
  subId: string;
  costPerUnit: number | null;
};

let ingredientRowCounter = 0;

export const generateIngredientRowId = () => {
  ingredientRowCounter = (ingredientRowCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `ing-${Date.now().toString(36)}-${ingredientRowCounter.toString(36)}`;
};

export const createIngredientRow = (
  overrides: Partial<Omit<IngredientRow, "subId">> & { subId?: string } = {},
): IngredientRow => ({
  type: overrides.type ?? "ingredient",
  qty: overrides.qty ?? "",
  unit: overrides.unit ?? "",
  item: overrides.item ?? "",
  prep: overrides.prep ?? "",
  yield: overrides.yield ?? "",
  cost: overrides.cost ?? "",
  subId: overrides.subId ?? generateIngredientRowId(),
  costPerUnit: overrides.costPerUnit ?? null,
});

export const createDividerRow = (label = "Step Break"): IngredientRow =>
  createIngredientRow({
    type: "divider",
    qty: "",
    unit: "",
    item: label,
    prep: "",
    yield: "",
    cost: "",
    costPerUnit: null,
  });
