import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Boxes,
  ChefHat,
  ChevronLeft,
  ClipboardList,
  DollarSign,
  Factory,
  FileText,
  HelpCircle,
  Images,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Sprout,
  Save,
  ShoppingCart,
  Truck,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";

type NavShortcut = {
  key: string;
  display: string;
};

type NavItemConfig = {
  to: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  shortcut?: NavShortcut;
};

type NavItem = NavItemConfig & { label: string };

const navItems: NavItemConfig[] = [
  {
    to: "/?tab=search",
    labelKey: "nav.recipes",
    fallback: "RECIPES",
    icon: BookOpenCheck,
    shortcut: { key: "Digit1", display: "1" },
  },
  {
    to: "/?tab=add-recipe",
    labelKey: "nav.addRecipe",
    fallback: "ADD RECIPE",
    icon: PenSquare,
    shortcut: { key: "Digit2", display: "2" },
  },
  {
    to: "/?tab=dish-assembly",
    labelKey: "nav.dishAssembly",
    fallback: "DISH ASSEMBLY",
    icon: UtensilsCrossed,
    shortcut: { key: "KeyD", display: "D" },
  },
  {
    to: "/?tab=menu-design",
    labelKey: "nav.menuDesignStudio",
    fallback: "MENU DESIGN STUDIO",
    icon: ChefHat,
    shortcut: { key: "KeyM", display: "M" },
  },
  {
    to: "/?tab=server-notes",
    labelKey: "nav.serverNotes",
    fallback: "SERVER NOTES",
    icon: ClipboardList,
    shortcut: { key: "Digit3", display: "3" },
  },
  {
    to: "/?tab=operations-docs",
    labelKey: "nav.operationsDocs",
    fallback: "OPERATIONS DOCS",
    icon: FileText,
    shortcut: { key: "KeyO", display: "O" },
  },
  {
    to: "/?tab=production",
    labelKey: "nav.production",
    fallback: "PRODUCTION",
    icon: Factory,
    shortcut: { key: "Digit4", display: "4" },
  },
  {
    to: "/?tab=purch-rec",
    labelKey: "nav.purchasingReceiving",
    fallback: "PURCH/REC",
    icon: ShoppingCart,
    shortcut: { key: "Digit0", display: "0" },
  },
  {
    to: "/?tab=saas",
    labelKey: "nav.saas",
    fallback: "SaaS",
    icon: Sparkles,
    shortcut: { key: "Digit5", display: "5" },
  },
  {
    to: "/?tab=inventory",
    labelKey: "nav.inventorySupplies",
    fallback: "Inventory & Supplies",
    icon: Boxes,
    shortcut: { key: "Digit6", display: "6" },
  },
  {
    to: "/?tab=nutrition",
    labelKey: "nav.nutritionAllergens",
    fallback: "Nutrition/Allergens",
    icon: Sprout,
    shortcut: { key: "Digit7", display: "7" },
  },
  {
    to: "/?tab=haccp",
    labelKey: "nav.haccpCompliance",
    fallback: "HACCP/Compliance",
    icon: ShieldCheck,
    shortcut: { key: "Digit8", display: "8" },
  },
  {
    to: "/?tab=waste-tracking",
    labelKey: "nav.wasteTracking",
    fallback: "WASTE TRACKING",
    icon: Trash2,
  },
  {
    to: "/?tab=customer-service",
    labelKey: "nav.customerService",
    fallback: "CUSTOMERS",
    icon: Users,
  },
  {
    to: "/?tab=plate-costing",
    labelKey: "nav.plateCosting",
    fallback: "COSTING",
    icon: DollarSign,
  },
  {
    to: "/?tab=suppliers",
    labelKey: "nav.suppliers",
    fallback: "SUPPLIERS",
    icon: Truck,
  },
  {
    to: "/?tab=gallery",
    labelKey: "nav.gallery",
    fallback: "GALLERY",
    icon: Images,
    shortcut: { key: "Digit9", display: "9" },
  },
];

type DissolvingTextProps = {
  collapsed: boolean;
  children: ReactNode;
  className?: string;
  ariaHidden?: boolean;
  expandedMaxWidthClass?: string;
  expandedWrapperClassName?: string;
  collapsedWrapperClassName?: string;
  expandedClassName?: string;
  collapsedClassName?: string;
};

function DissolvingText({
  collapsed,
  children,
  className,
  ariaHidden,
  expandedMaxWidthClass = "max-w-full",
  expandedWrapperClassName,
  collapsedWrapperClassName,
  expandedClassName,
  collapsedClassName,
}: DissolvingTextProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      className={cn(
        "relative block overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out",
        collapsed
          ? cn("max-w-0", collapsedWrapperClassName)
          : cn(expandedMaxWidthClass, expandedWrapperClassName),
      )}
    >
      <span
        className={cn(
          "block transition-all duration-300 ease-out",
          collapsed
            ? cn("opacity-0 blur-sm translate-y-[2px]", collapsedClassName)
            : cn("opacity-100 blur-0 translate-y-0", expandedClassName),
          className,
        )}
      >
        {children}
      </span>
    </span>
  );
}

type TabLinkProps = {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  shortcutDisplay?: string;
};

function TabLink({
  to,
  label,
  icon: Icon,
  collapsed,
  shortcutDisplay,
}: TabLinkProps) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("tab") ?? "search";
  const value = new URLSearchParams(to.split("?")[1] || "").get("tab") || "";
  const isActive = active === value;

  const link = (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "group flex w-full items-center rounded-md text-sm font-medium transition-all duration-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed
          ? "justify-center gap-0 px-1.5 py-1.5"
          : "gap-1.5 px-2.5 py-1.5",
        isActive
          ? "bg-primary text-primary-foreground shadow"
          : "text-foreground/75 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-transform duration-500",
          collapsed ? "" : "group-hover:scale-[1.05]",
        )}
        aria-hidden
      />
      <DissolvingText
        collapsed={collapsed}
        ariaHidden={collapsed}
        className="text-ellipsis"
        expandedClassName="ml-2"
        collapsedClassName="ml-0"
        expandedMaxWidthClass="max-w-[180px]"
      >
        {label}
      </DissolvingText>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className="text-xs font-medium"
      >
        <div className="flex flex-col items-start">
          <span>{label}</span>
          {shortcutDisplay ? (
            <span className="mt-1 text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
              {shortcutDisplay}
            </span>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function TopTabs() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const storedPreferenceRef = useRef(false);
  const collapseTimerRef = useRef<number | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const stored = window.sessionStorage.getItem("nav:collapsed");
    if (stored === "true" || stored === "false") {
      storedPreferenceRef.current = true;
      return stored === "true";
    }
    return false;
  });
  const [showHelp, setShowHelp] = useState(false);
  const shortcutLabel = useMemo(() => {
    if (typeof navigator === "undefined") {
      return "Ctrl";
    }
    return /(mac|iphone|ipad|ipod)/i.test(navigator.platform) ? "⌘" : "Ctrl";
  }, []);

  useEffect(() => {
    if (storedPreferenceRef.current) {
      return;
    }

    collapseTimerRef.current = window.setTimeout(() => {
      setCollapsed((prev) => {
        if (prev) return prev;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("nav:collapsed", "true");
        }
        return true;
      });
    }, 425);

    return () => {
      if (collapseTimerRef.current !== null) {
        window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const baseOffset = 88;
    document.documentElement.style.setProperty(
      "--sidebar-offset",
      `${baseOffset}px`,
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-offset");
    };
  }, []);

  useEffect(() => {
    if (collapsed) {
      setShowHelp(false);
    }
  }, [collapsed]);

  const navToggleShortcut = `${shortcutLabel}+Shift+N`;

  const translatedNavItems: NavItem[] = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        label: t(item.labelKey, item.fallback),
      })),
    [t],
  );

  const navShortcutMap = useMemo(() => {
    return navItems.reduce(
      (acc, item) => {
        if (item.shortcut) {
          acc[item.shortcut.key] = item.to;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }, []);

  const setCollapsedManual = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      storedPreferenceRef.current = true;
      if (collapseTimerRef.current !== null) {
        window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      setCollapsed((prev) => {
        const next =
          typeof value === "function"
            ? (value as (state: boolean) => boolean)(prev)
            : value;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("nav:collapsed", String(next));
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMac = shortcutLabel === "⌘";

    const handleKeydown = (event: KeyboardEvent) => {
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (!modifier || !event.shiftKey) return;
      if (event.key.toLowerCase() !== "n") return;
      event.preventDefault();
      setCollapsedManual((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [setCollapsedManual, shortcutLabel]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMac = shortcutLabel === "⌘";

    const handleNavShortcut = (event: KeyboardEvent) => {
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (!modifier || event.repeat) return;
      const target = navShortcutMap[event.code];
      if (!target) return;
      event.preventDefault();
      navigate(target);
    };

    window.addEventListener("keydown", handleNavShortcut);
    return () => window.removeEventListener("keydown", handleNavShortcut);
  }, [navigate, navShortcutMap, shortcutLabel]);

  return (
    <>
      <TooltipProvider delayDuration={collapsed ? 0 : 200}>
        <aside
          ref={asideRef}
          className={cn(
            "pointer-events-auto fixed left-0 top-24 z-[3200] flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-[0_32px_65px_-18px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-all duration-700 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:shadow-[0_0_70px_rgba(56,189,248,0.65)] sm:top-28",
            collapsed ? "w-14 space-y-2 p-2" : "w-60 space-y-3.5 p-4",
          )}
        >
          <div className="relative flex h-full flex-col">
            <div
              className={cn(
                "flex items-center gap-2 transition-all duration-500",
                collapsed ? "justify-center gap-1" : "justify-start",
              )}
            >
              {!collapsed ? (
                <span className="rounded-full border border-white/60 bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm dark:border-cyan-500/40 dark:bg-slate-900/70 dark:text-cyan-200">
                  Navigation
                </span>
              ) : null}
            </div>

            <nav
              className={cn(
                "max-h-[70vh] space-y-1 overflow-y-auto pr-1 transition-all duration-700",
                collapsed && "pr-0",
              )}
            >
              {translatedNavItems.map((item) => (
                <TabLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  shortcutDisplay={
                    item.shortcut
                      ? `${shortcutLabel}+${item.shortcut.display}`
                      : undefined
                  }
                />
              ))}
            </nav>

            <div
              className={cn(
                "space-y-3 border-t border-white/50 pt-3 text-sm transition-all duration-700 dark:border-slate-800/60",
                collapsed && "border-transparent pt-2",
              )}
            >
              <button
                type="button"
                title="Help & Shortcuts"
                onClick={() => setShowHelp(true)}
                className={cn(
                  "flex w-full items-center rounded-md px-2.5 py-1.5 font-medium text-foreground transition duration-300 hover:bg-white/70 dark:hover:bg-slate-900/70",
                  collapsed ? "justify-center px-1.5" : "justify-between",
                )}
              >
                <DissolvingText
                  collapsed={collapsed}
                  ariaHidden={collapsed}
                  className="text-sm font-medium"
                >
                  {t("recipe.actions.help", "Help & Shortcuts")}
                </DissolvingText>
                <HelpCircle className="h-4 w-4" aria-hidden />
              </button>

              <div
                className={cn(
                  "flex items-center justify-between rounded-md bg-white/60 px-2.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all duration-700 dark:bg-slate-900/70",
                  collapsed && "flex-col gap-1.5 px-2 py-1.5",
                )}
              >
                <DissolvingText
                  collapsed={collapsed}
                  ariaHidden={collapsed}
                  className="text-sm font-medium"
                >
                  {t("recipe.actions.theme", "Theme")}
                </DissolvingText>
                <ThemeToggle />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsedManual((prev) => !prev)}
              className="group absolute right-[-18px] top-1/2 z-10 -translate-y-1/2 select-none rounded-full border border-primary/40 bg-primary/15 px-1.5 py-2.5 shadow transition duration-300 hover:bg-primary/25 hover:shadow-[0_0_20px_rgba(59,130,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-cyan-400/60 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 dark:hover:shadow-[0_0_24px_rgba(34,211,238,0.55)]"
              aria-label={
                collapsed ? "Expand navigation" : "Collapse navigation"
              }
              aria-pressed={!collapsed}
              aria-expanded={!collapsed}
              title={`${collapsed ? "Expand navigation" : "Collapse navigation"} (${navToggleShortcut})`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "block h-4 w-0.5 rounded-full bg-primary/80 transition-all duration-300 dark:bg-cyan-300",
                    collapsed
                      ? "translate-y-0 rotate-0"
                      : "-translate-y-[3px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "block h-4 w-0.5 rounded-full bg-primary/80 transition-all duration-300 dark:bg-cyan-300",
                    collapsed
                      ? "opacity-100 scale-y-100"
                      : "opacity-0 scale-y-0",
                  )}
                />
                <span
                  className={cn(
                    "block h-4 w-0.5 rounded-full bg-primary/80 transition-all duration-300 dark:bg-cyan-300",
                    collapsed
                      ? "translate-y-0 rotate-0"
                      : "translate-y-[3px] -rotate-45",
                  )}
                />
              </div>
            </button>
          </div>
        </aside>
      </TooltipProvider>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Help & Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-medium">Keyboard shortcuts (hold Control/⌘):</p>
            <ul className="list-disc pl-5">
              <li>P=Pastry</li>
              <li>T=Technique</li>
              <li>C=Course</li>
              <li>A=Allergens</li>
              <li>D=Diets</li>
              <li>M=Meal Period</li>
              <li>U=Cuisine</li>
              <li>S=Service Style</li>
              <li>Y=Difficulty</li>
              <li>E=Equipment</li>
            </ul>
            <p className="mt-2 font-medium">Adding recipes</p>
            <ul className="list-disc pl-5">
              <li>
                Use Add Recipe to type/paste. “Save�� persists immediately. CSV
                export includes Directions; Share and SMS send a formatted
                recipe.
              </li>
              <li>
                Import from the web: paste a URL in the right sidebar. The
                importer reads JSON��LD or page sections, pulls times/yield, and
                attaches the cover image to the gallery.
              </li>
            </ul>
            <p className="mt-2 font-medium">Importing a Book PDF</p>
            <ul className="list-disc pl-5">
              <li>
                Select a PDF in Recipe Search → Library. We parse the appendix
                (recipe index) and show a selectable checklist with hidden
                scrollbar.
              </li>
              <li>
                Choose the recipes to import; each is processed one‑by‑one with
                page cross-reference, metadata (prep/cook/total/yield/temp) and
                a photo when available.
              </li>
            </ul>
            <p className="mt-2 font-medium">Gallery</p>
            <ul className="list-disc pl-5">
              <li>
                Grid or Masonry layout; choose thumbnail size
                (Small/Medium/Large). Hover to get a soft glow; click to open
                the lightbox.
              </li>
              <li>
                Use tags to group photos and create Look Books. Open a Look Book
                for an immersive showcase with storyboard navigation and quick
                action controls.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Tip: Use “Link to recipes” to auto-match images to recipes by
              filename.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
