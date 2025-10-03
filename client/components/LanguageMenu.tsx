import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, FlaskConical } from "lucide-react";

export type LanguageOption = {
  code: string;
  label: string;
  flag: string;
};

const languageOptions: LanguageOption[] = [
  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
];

export type LanguageMenuProps = {
  value: string;
  onChange: (code: string) => void;
  isDark?: boolean;
  className?: string;
};

export default function LanguageMenu({ value, onChange, isDark, className }: LanguageMenuProps) {
  const active = languageOptions.find((option) => option.code === value) ?? languageOptions[0];

  const triggerClasses = cn(
    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
    isDark
      ? "border-cyan-400/50 bg-slate-900/80 text-cyan-100 hover:bg-slate-900 focus-visible:ring-cyan-400/50"
      : "border-slate-300 bg-white/80 text-slate-800 hover:bg-white focus-visible:ring-blue-200",
    className,
  );

  const itemClasses = (selected: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
      selected
        ? isDark
          ? "bg-cyan-900/50 text-cyan-100"
          : "bg-blue-100 text-blue-900"
        : isDark
          ? "hover:bg-slate-800/70"
          : "hover:bg-slate-100",
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClasses}
          title="Change Language"
          aria-label={`Change language, currently ${active.label}`}
        >
          <FlaskConical className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Language</span>
          <span className="text-lg leading-none" aria-hidden>
            {active.flag}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn("w-60 p-2", isDark ? "bg-slate-900/95 text-cyan-100" : "bg-white/95 text-slate-900") )}>
        <div className="space-y-1">
          {languageOptions.map((option) => {
            const selected = option.code === value;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => onChange(option.code)}
                className={itemClasses(selected)}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {option.flag}
                </span>
                <span className="flex-1 text-left font-medium">{option.label}</span>
                {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { languageOptions };