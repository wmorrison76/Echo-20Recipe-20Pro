import { cn } from "@/lib/utils";

export type AddRecipeToolsPanelProps = {
  onConvertUnits: () => void;
  onSaveSnapshot: () => void;
  onAltUnits?: () => void;
  onCycleCurrency: () => void;
  onOpenYieldLab: () => void;
  isDarkMode?: boolean;
  className?: string;
};

const tools: { label: string; action: keyof Omit<AddRecipeToolsPanelProps, "isDarkMode" | "className"> }[] = [
  { label: "Convert Units", action: "onConvertUnits" },
  { label: "Save Snapshot", action: "onSaveSnapshot" },
  { label: "Alt Units", action: "onAltUnits" },
  { label: "Currency", action: "onCycleCurrency" },
  { label: "Yield Lab", action: "onOpenYieldLab" },
];

export default function AddRecipeToolsPanel(props: AddRecipeToolsPanelProps) {
  const { isDarkMode, className, ...handlers } = props;
  const cardClasses = cn(
    "rounded-2xl border p-4 shadow-lg transition-colors",
    isDarkMode
      ? "border-cyan-400/30 bg-cyan-950/30 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
      : "border-slate-200 bg-white/90 text-slate-800 shadow-slate-200/60",
    className,
  );

  const buttonClasses = isDarkMode
    ? "rounded-lg border border-cyan-400/40 bg-cyan-900/40 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-0"
    : "rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-0";

  return (
    <div className={cardClasses}>
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em]">
        Add Recipe Tools
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const specificHandler = handlers[tool.action] as (() => void) | undefined;
          const handler = specificHandler ?? handlers.onConvertUnits;
          return (
            <button
              key={tool.label}
              type="button"
              onClick={handler}
              className={buttonClasses}
            >
              {tool.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
