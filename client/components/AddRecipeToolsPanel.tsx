import LanguageMenu from "./LanguageMenu";
import LanguageMenu from "./LanguageMenu";
import { cn } from "@/lib/utils";

export type AddRecipeToolsPanelProps = {
  onConvertUnits: () => void;
  onSaveSnapshot: () => void;
  onAltUnits?: () => void;
  onCycleCurrency: () => void;
  onOpenYieldLab: () => void;
  languageValue: string;
  onLanguageChange: (code: string) => void;
  isDarkMode?: boolean;
  className?: string;
};

export default function AddRecipeToolsPanel(props: AddRecipeToolsPanelProps) {
  const {
    onConvertUnits,
    onSaveSnapshot,
    onAltUnits,
    onCycleCurrency,
    onOpenYieldLab,
    languageValue,
    onLanguageChange,
    isDarkMode,
    className,
  } = props;

  const cardClasses = cn(
    "rounded-2xl border p-4 shadow-lg transition-colors",
    isDarkMode
      ? "border-cyan-400/30 bg-cyan-950/30 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
      : "border-slate-200 bg-white/90 text-slate-800 shadow-slate-200/60",
    className,
  );

  const buttonClasses = isDarkMode
    ? "w-full rounded-lg border border-cyan-400/40 bg-cyan-900/40 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-0"
    : "w-full rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-0";

  const renderButton = (label: string, handler: () => void) => (
    <button type="button" onClick={handler} className={buttonClasses}>
      {label}
    </button>
  );

  const altHandler = onAltUnits ?? onConvertUnits;

  return (
    <div className={cardClasses}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.12em]">
          Add Recipe Tools
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <LanguageMenu
          value={languageValue}
          onChange={onLanguageChange}
          isDark={isDarkMode}
          className="w-full justify-center"
        />
        {renderButton("Convert Units", onConvertUnits)}
        {renderButton("Save Snapshot", onSaveSnapshot)}
        {renderButton("Alt Units", altHandler)}
        {renderButton("Currency", onCycleCurrency)}
        {renderButton("Yield Lab", onOpenYieldLab)}
      </div>
    </div>
  );
}
