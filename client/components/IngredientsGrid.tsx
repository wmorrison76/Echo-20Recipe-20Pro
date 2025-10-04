import React from "react";
import { MinusCircle, PlusCircle, Save } from "lucide-react";
import type { IngredientRow } from "@/types/ingredients";

type IngredientsGridProps = {
  isDarkMode: boolean;
  ingredients: IngredientRow[];
  currencySymbol: string;
  totalCost: number;
  theoreticalVolumeLabel: string;
  activeCount: number;
  averageYield: number | null;
  methodOptions: string[];
  methodOptionsId: string;
  onFieldChange: (
    index: number,
    field: keyof IngredientRow,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFieldBlur: (
    index: number,
    field: "yield" | "cost",
  ) => (event: React.FocusEvent<HTMLInputElement>) => void;
  onAddRow: (index?: number) => void;
  onRemoveRow: (index: number) => void;
  onGridKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSnapshot: () => void;
};

const inputTone = (
  isDark: boolean,
  extra?: string,
  alignRight?: boolean,
) =>
  `w-full rounded-lg border px-3 py-2 text-sm ${alignRight ? "text-right" : ""} ${
    isDark
      ? "border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50 focus:ring-cyan-400/60 focus:ring-offset-slate-950"
      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-sky-300/60 focus:ring-offset-white"
  } focus:outline-none focus:ring-2 focus:ring-offset-1 ${extra ?? ""}`;

const IngredientsGrid: React.FC<IngredientsGridProps> = ({
  isDarkMode,
  ingredients,
  currencySymbol,
  totalCost,
  theoreticalVolumeLabel,
  activeCount,
  averageYield,
  methodOptions,
  methodOptionsId,
  onFieldChange,
  onFieldBlur,
  onAddRow,
  onRemoveRow,
  onGridKeyDown,
  onSnapshot,
}) => {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-lg ${
        isDarkMode
          ? "bg-slate-950/50 border-cyan-500/25 shadow-cyan-500/10"
          : "bg-white border-slate-200 shadow-slate-300/40"
      }`}
      data-echo-key="section:add:ingredients"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3
            className={`text-lg font-semibold uppercase tracking-[0.28em] ${
              isDarkMode ? "text-cyan-300" : "text-slate-700"
            }`}
          >
            Ingredients
          </h3>
          <p
            className={`mt-1 max-w-xl text-xs leading-relaxed ${
              isDarkMode ? "text-cyan-200/60" : "text-slate-500"
            }`}
          >
            Track each component with quantity, unit, prep method, yield %, and cost to keep recipe costing and lab documentation aligned.
          </p>
        </div>
        <div
          className={`flex flex-col items-end text-xs ${
            isDarkMode ? "text-cyan-200/80" : "text-slate-600"
          }`}
        >
          <span>
            Active items:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>
              {activeCount}
            </strong>
          </span>
          <span>
            Total cost:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>
              {currencySymbol}
              {totalCost.toFixed(2)}
            </strong>
          </span>
          <span>
            Avg yield:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>
              {averageYield == null ? "—" : `${averageYield.toFixed(1)}%`}
            </strong>
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[960px] space-y-1">
          <div
            className={`grid grid-cols-[3rem,6rem,6rem,minmax(18rem,2fr),minmax(16rem,1.6fr),8rem,8rem,3rem] items-center gap-3 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
              isDarkMode ? "bg-slate-900/70 text-cyan-200/70" : "bg-slate-100 text-slate-600"
            }`}
          >
            <span>#</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Ingredient</span>
            <span>Method / Prep</span>
            <span>Yield %</span>
            <span>Cost</span>
            <span />
          </div>
          {ingredients.map((row, index) => (
            <div
              key={`${index}-${row.item || "blank"}`}
              className={`grid grid-cols-[3rem,6rem,6rem,minmax(18rem,2fr),minmax(16rem,1.6fr),8rem,8rem,3rem] items-stretch gap-3 rounded-2xl border px-3 py-2 ${
                isDarkMode
                  ? "border-cyan-500/20 bg-slate-950/40 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.45)]"
                  : "border-slate-200 bg-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.35)]"
              }`}
            >
              <div className="flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-cyan-300">
                {index + 1}
              </div>
              <input
                data-row={index}
                data-col={0}
                value={row.qty}
                onChange={onFieldChange(index, "qty")}
                onKeyDown={onGridKeyDown}
                className={inputTone(isDarkMode, "px-2", false)}
                placeholder="1 1/2"
              />
              <input
                data-row={index}
                data-col={1}
                value={row.unit}
                onChange={onFieldChange(index, "unit")}
                onKeyDown={onGridKeyDown}
                className={inputTone(isDarkMode, "px-2 uppercase", false)}
                placeholder="QTS"
              />
              <input
                data-row={index}
                data-col={2}
                value={row.item}
                onChange={onFieldChange(index, "item")}
                onKeyDown={onGridKeyDown}
                className={inputTone(isDarkMode)}
                placeholder="Ingredient"
              />
              <input
                data-row={index}
                data-col={3}
                value={row.prep}
                onChange={onFieldChange(index, "prep")}
                onKeyDown={onGridKeyDown}
                list={methodOptions.length ? methodOptionsId : undefined}
                className={inputTone(isDarkMode)}
                placeholder="Method or prep notes"
              />
              <input
                data-row={index}
                data-col={4}
                value={row.yield}
                onChange={onFieldChange(index, "yield")}
                onBlur={onFieldBlur(index, "yield")}
                onKeyDown={onGridKeyDown}
                className={inputTone(isDarkMode, undefined, true)}
                placeholder="100"
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-cyan-500">
                  {currencySymbol}
                </span>
                <input
                  data-row={index}
                  data-col={5}
                  value={row.cost}
                  onChange={onFieldChange(index, "cost")}
                  onBlur={onFieldBlur(index, "cost")}
                  onKeyDown={onGridKeyDown}
                  className={inputTone(isDarkMode, "pl-5", true)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onAddRow(index)}
                  className={`rounded-full border p-1 transition ${
                    isDarkMode
                      ? "border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Insert row below"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRow(index)}
                  className={`rounded-full border p-1 transition ${
                    isDarkMode
                      ? "border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Remove row"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {methodOptions.length > 0 && (
            <datalist id={methodOptionsId}>
              {methodOptions.map((method) => (
                <option key={method} value={method} />
              ))}
            </datalist>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className={isDarkMode ? "text-cyan-200/75" : "text-slate-500"}>
          Theoretical volume captured:{" "}
          <span className="font-semibold text-slate-700 dark:text-cyan-100">
            {theoreticalVolumeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddRow()}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              isDarkMode
                ? "bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Add ingredient
          </button>
          <button
            type="button"
            onClick={onSnapshot}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition ${
              isDarkMode
                ? "border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                : "border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Save className="h-4 w-4" />
            Snapshot
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientsGrid;
