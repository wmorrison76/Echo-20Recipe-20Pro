import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage, useTranslation } from "@/context/LanguageContext";
import { languageOptions, type LanguageOption } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type LanguageMenuVariant = "card" | "compact";

export type LanguageMenuProps = {
  variant?: LanguageMenuVariant;
  isDark?: boolean;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
};

export default function LanguageMenu({
  variant = "card",
  isDark,
  className,
  contentClassName,
  align = "end",
}: LanguageMenuProps) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const active = (languageOptions.find((option) => option.code === language) ?? languageOptions[0]) as LanguageOption;

  const triggerClasses = cn(
    variant === "card"
      ? "flex h-full min-h-[4.25rem] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left shadow-inner transition-colors"
      : "inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors",
    isDark
      ? variant === "card"
        ? "border-cyan-400/40 bg-cyan-900/30 text-cyan-100 hover:bg-cyan-900/50"
        : "border-cyan-400/40 bg-slate-900/70 text-cyan-100 hover:bg-slate-900/60"
      : variant === "card"
        ? "border-slate-200 bg-white/90 text-slate-800 hover:bg-white"
        : "border-slate-300 bg-white/85 text-slate-700 hover:bg-white",
    className,
  );

  const optionClasses = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      selected
        ? isDark
          ? "bg-cyan-900/50 text-cyan-100"
          : "bg-blue-100 text-blue-900"
        : isDark
          ? "hover:bg-slate-800/60"
          : "hover:bg-slate-100",
    );

  const label = t("recipe.tools.language", "Change Language");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClasses}
          title={`${label} (${active.label})`}
          aria-label={`${label}, ${active.label}`}
        >
          {variant === "card" ? (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm font-semibold leading-tight">
                {label}
              </span>
              <span className="text-2xl leading-none" aria-hidden>
                {active.flag}
              </span>
            </div>
          ) : (
            <>
              <span className="sr-only">{`${label} (${active.label})`}</span>
              <span className="text-2xl leading-none" aria-hidden>
                {active.flag}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-60 p-2",
          isDark ? "bg-slate-900/95 text-cyan-100" : "bg-white/95 text-slate-900",
          contentClassName,
        )}
      >
        <div className="space-y-1">
          {languageOptions.map((option) => {
            const selected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                className={optionClasses(selected)}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {option.flag}
                </span>
                <span className="sr-only">{option.label}</span>
                {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
