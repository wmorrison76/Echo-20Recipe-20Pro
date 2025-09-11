import React from "react";

export default function NutritionLabel({ data, servings, perServing }: { data: any; servings: number; perServing: boolean }) {
  if (!data) return null;
  const base = perServing && servings > 0 ? 1 / servings : 1;
  const fmt = (n: any) => typeof n === 'number' ? (n * base).toFixed(1) : n;
  const calories = fmt((data.calories as number) || (data?.totalNutrients?.ENERC_KCAL?.quantity as number) || 0);
  const fat = fmt(data?.totalNutrients?.FAT?.quantity || 0);
  const carbs = fmt(data?.totalNutrients?.CHOCDF?.quantity || 0);
  const protein = fmt(data?.totalNutrients?.PROCNT?.quantity || 0);
  return (
    <div className="border p-3 rounded-lg w-64 bg-white text-black">
      <div className="text-2xl font-extrabold border-b pb-1">Nutrition Facts</div>
      <div className="mt-2 text-sm">Calories <span className="float-right font-semibold">{calories}</span></div>
      <div className="mt-2 text-sm">Fat <span className="float-right">{fat} g</span></div>
      <div className="mt-1 text-sm">Carbs <span className="float-right">{carbs} g</span></div>
      <div className="mt-1 text-sm">Protein <span className="float-right">{protein} g</span></div>
      <div className="mt-3 text-[10px] text-gray-600">Auto-generated summary. Totals scaled {perServing? 'per serving' : 'for whole recipe'}.</div>
    </div>
  );
}
