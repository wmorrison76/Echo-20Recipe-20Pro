export type IngredientRow = {
  qty: string;
  unit: string;
  item: string;
  prep: string;
  yield: string;
  cost: string;
  subId: string;
};

export const createIngredientRow = (): IngredientRow => ({
  qty: "",
  unit: "",
  item: "",
  prep: "",
  yield: "",
  cost: "",
  subId: "",
});
