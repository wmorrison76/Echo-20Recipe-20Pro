export type IngredientRow = {
  qty: string;
  unit: string;
  item: string;
  prep: string;
  yield: string;
  cost: string;
  subId: string;
};

let ingredientRowCounter = 0;

export const generateIngredientRowId = () => {
  ingredientRowCounter = (ingredientRowCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `ing-${Date.now().toString(36)}-${ingredientRowCounter.toString(36)}`;
};

export const createIngredientRow = (): IngredientRow => ({
  qty: "",
  unit: "",
  item: "",
  prep: "",
  yield: "",
  cost: "",
  subId: generateIngredientRowId(),
});
