import { GripVertical, Link2, MinusCircle, PlusCircle } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { formatYieldPercent } from "@/lib/yield-calculations";
import type { IngredientRow, IngredientYieldInsight } from "@/types/ingredients";

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
  yieldInsights?: Array<IngredientYieldInsight | null>;
  onApplyYieldSuggestion?: (index: number) => void;
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
  onReorderRow: (from: number, to: number) => void;
  onGridKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddSubRecipe: () => void;
  onAddDivider: () => void;
};

const inputTone = (
  isDark: boolean,
  extra?: string,
  alignRight?: boolean,
  disabled?: boolean,
) =>
  `w-full rounded-lg border px-3 py-2 text-sm ${alignRight ? "text-right" : ""} ${
    isDark
      ? "border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50 focus:ring-cyan-400/60 focus:ring-offset-slate-950"
      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-sky-300/60 focus:ring-offset-white"
  } focus:outline-none focus:ring-2 focus:ring-offset-1 ${extra ?? ""} ${
    disabled ? "opacity-60" : ""
  }`;

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
  onReorderRow,
  onGridKeyDown,
  onAddSubRecipe,
  onAddDivider,
  yieldInsights,
  onApplyYieldSuggestion,
}) => {
  const { t } = useTranslation();

  const handleDragStart = (index: number) => (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleRowDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleRowDrop = (targetIndex: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isNaN(sourceIndex)) return;
    onReorderRow(sourceIndex, targetIndex);
  };

  const handleContainerDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isNaN(sourceIndex)) return;
    onReorderRow(sourceIndex, ingredients.length);
  };

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
            {t("recipe.ingredients.activeItems", "Active items")}:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>{activeCount}</strong>
          </span>
          <span>
            {t("recipe.ingredients.totalCost", "Total cost")}:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>
              {currencySymbol}
              {totalCost.toFixed(2)}
            </strong>
          </span>
          <span>
            {t("recipe.ingredients.averageYield", "Avg yield")}:{" "}
            <strong className={isDarkMode ? "text-cyan-100" : "text-slate-900"}>
              {averageYield == null ? "—" : `${averageYield.toFixed(1)}%`}
            </strong>
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div
          className="min-w-[960px] space-y-1"
          onDragOver={handleRowDragOver}
          onDrop={handleContainerDrop}
        >
          <div
            className={`grid grid-cols-[minmax(2.75rem,3.5rem),5rem,7ch,minmax(18rem,2fr),minmax(13.5rem,1.25fr),6.5ch,14.5ch,2.5rem] items-center gap-3 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
              isDarkMode ? "bg-slate-900/70 text-cyan-200/70" : "bg-slate-100 text-slate-600"
            }`}
          >
            <span>#</span>
            <span>{t("recipe.ingredients.columns.qty", "Qty")}</span>
            <span>{t("recipe.ingredients.columns.unit", "Unit")}</span>
            <span>{t("recipe.ingredients.columns.item", "Ingredient")}</span>
            <span>{t("recipe.ingredients.columns.prep", "Method / Prep")}</span>
            <span>{t("recipe.ingredients.columns.yield", "Yield %")}</span>
            <span>{t("recipe.ingredients.columns.cost", "Cost")}</span>
            <span />
          </div>
          {ingredients.map((row, index) => {
            const isDivider = row.type === "divider";
            const rowTone = isDivider
              ? isDarkMode
                ? "border-cyan-500/30 bg-cyan-500/10"
                : "border-slate-300 bg-slate-100/80"
              : isDarkMode
                ? "border-cyan-500/20 bg-slate-950/40 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.45)]"
                : "border-slate-200 bg-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.35)]";
            const insight = yieldInsights?.[index] ?? null;
            const recommendedPercent = insight?.combinedPercent ?? null;
            const parsedYield = Number(
              String(row.yield || "").replace(/[^0-9.]/g, ""),
            );
            const shouldShowApply =
              !isDivider &&
              recommendedPercent != null &&
              typeof onApplyYieldSuggestion === "function" &&
              (!Number.isFinite(parsedYield) ||
                Math.abs(parsedYield - recommendedPercent) > 0.51);

            return (
              <div
                key={row.subId ?? `${index}-${row.item || "blank"}`}
                className={`grid grid-cols-[minmax(2.75rem,3.5rem),5rem,7ch,minmax(18rem,2fr),minmax(13.5rem,1.25fr),6.5ch,14.5ch,2.5rem] items-stretch gap-3 rounded-2xl border px-3 py-2 transition-colors ${rowTone}`}
                onDragOver={handleRowDragOver}
                onDrop={handleRowDrop(index)}
                data-row-kind={row.type}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    draggable
                    onDragStart={handleDragStart(index)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      isDarkMode
                        ? "border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10"
                        : "border-slate-300 text-slate-500 hover:bg-slate-200/80"
                    }`}
                    title={t("recipe.ingredients.dragHandle", "Drag to reorder")}
                    aria-label={t("recipe.ingredients.dragHandle", "Drag to reorder")}
                  >
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="text-xs font-semibold text-slate-500 dark:text-cyan-300">
                    {index + 1}
                  </span>
                </div>
                <input
                  data-row={index}
                  data-col={0}
                  value={row.qty}
                  onChange={onFieldChange(index, "qty")}
                  onKeyDown={onGridKeyDown}
                  disabled={isDivider}
                  className={inputTone(isDarkMode, "px-2", false, isDivider)}
                  placeholder={
                    isDivider ? "" : t("recipe.ingredients.placeholders.qty", "1 1/2")
                  }
                />
                <input
                  data-row={index}
                  data-col={1}
                  value={row.unit}
                  onChange={onFieldChange(index, "unit")}
                  onKeyDown={onGridKeyDown}
                  disabled={isDivider}
                  className={inputTone(
                    isDarkMode,
                    "px-2 text-center uppercase",
                    false,
                    isDivider,
                  )}
                  placeholder={
                    isDivider ? "" : t("recipe.ingredients.placeholders.unit", "QTS")
                  }
                />
                <input
                  data-row={index}
                  data-col={2}
                  value={row.item}
                  onChange={onFieldChange(index, "item")}
                  onKeyDown={onGridKeyDown}
                  className={inputTone(
                    isDarkMode,
                    isDivider ? "font-semibold uppercase tracking-[0.2em]" : undefined,
                    false,
                    false,
                  )}
                  placeholder={
                    isDivider
                      ? t("recipe.ingredients.placeholders.step", "Step label or section")
                      : t("recipe.ingredients.placeholders.item", "Ingredient")
                  }
                />
                <input
                  data-row={index}
                  data-col={3}
                  value={row.prep}
                  onChange={onFieldChange(index, "prep")}
                  onKeyDown={onGridKeyDown}
                  disabled={isDivider}
                  list={!isDivider && methodOptions.length ? methodOptionsId : undefined}
                  className={inputTone(isDarkMode, undefined, false, isDivider)}
                  placeholder={
                    isDivider
                      ? ""
                      : t("recipe.ingredients.placeholders.prep", "Method or prep notes")
                  }
                />
                <div className="flex flex-col gap-1">
                  <input
                    data-row={index}
                    data-col={4}
                    value={row.yield}
                    onChange={onFieldChange(index, "yield")}
                    onBlur={onFieldBlur(index, "yield")}
                    onKeyDown={onGridKeyDown}
                    disabled={isDivider}
                    className={inputTone(
                      isDarkMode,
                      "px-2 text-center",
                      true,
                      isDivider,
                    )}
                    maxLength={6}
                    placeholder={
                      isDivider
                        ? ""
                        : t("recipe.ingredients.placeholders.yield", "100")
                    }
                  />
                  {!isDivider && insight && (
                    <div
                      className={`rounded-md border px-2 py-1 text-[10px] leading-tight ${
                        isDarkMode
                          ? "border-cyan-500/20 bg-slate-900/70 text-cyan-200/80"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span>
                          {recommendedPercent != null
                            ? `Suggested: ${formatYieldPercent(
                                recommendedPercent,
                              )}%`
                            : "No suggestion yet"}
                        </span>
                        {shouldShowApply && (
                          <button
                            type="button"
                            className={`rounded border px-1 py-0.5 font-semibold uppercase tracking-wide ${
                              isDarkMode
                                ? "border-cyan-500/40 text-cyan-200"
                                : "border-slate-300 text-slate-700"
                            }`}
                            onClick={() => onApplyYieldSuggestion?.(index)}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {insight.basePercent != null && insight.baseReason && (
                          <div>
                            Base: {formatYieldPercent(insight.basePercent)}% · {insight.baseReason}
                          </div>
                        )}
                        {insight.chefPercent != null && (
                          <div>
                            Chef: {formatYieldPercent(insight.chefPercent)}%
                            {insight.chefMethod ? ` · ${insight.chefMethod}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative flex w-full items-center gap-1">
                  <span
                    className={`pointer-events-none text-sm font-semibold ${
                      isDarkMode ? "text-cyan-300" : "text-slate-500"
                    } ${isDivider ? "opacity-40" : ""}`}
                  >
                    {currencySymbol}
                  </span>
                  <input
                    data-row={index}
                    data-col={5}
                    value={row.cost}
                    onChange={onFieldChange(index, "cost")}
                    onBlur={onFieldBlur(index, "cost")}
                    onKeyDown={onGridKeyDown}
                    disabled={isDivider}
                    className={inputTone(isDarkMode, "px-2 text-right", false, isDivider)}
                    maxLength={14}
                    placeholder={
                      isDivider ? "" : t("recipe.ingredients.placeholders.cost", "0.00")
                    }
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(index)}
                    className={`rounded-full border p-1 transition ${
                      isDarkMode
                        ? "border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                        : "border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={t("recipe.ingredients.removeRow", "Remove row")}
                    aria-label={t("recipe.ingredients.removeRow", "Remove row")}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
          {t("recipe.ingredients.volumeLabel", "Theoretical volume captured")}:{" "}
          <span className="font-semibold text-slate-700 dark:text-cyan-100">
            {theoreticalVolumeLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            {t("recipe.ingredients.addIngredient", "Add ingredient")}
          </button>
          <button
            type="button"
            onClick={onAddSubRecipe}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition ${
              isDarkMode
                ? "border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                : "border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Link2 className="h-4 w-4" />
            {t("recipe.ingredients.addSubRecipe", "Add sub recipe")}
          </button>
          <button
            type="button"
            onClick={onAddDivider}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition ${
              isDarkMode
                ? "border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                : "border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t("recipe.ingredients.addDivider", "Add break")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientsGrid;
