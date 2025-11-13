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
  BookMarked,
  Boxes,
  ChefHat,
  ChevronLeft,
  ListChecks,
  DollarSign,
  Warehouse,
  FileText,
  HelpCircle,
  ImageIcon,
  PencilLine,
  Shield,
  Wand2,
  Leaf,
  Save,
  ShoppingCart,
  Truck,
  Trash,
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
    icon: BookMarked,
    shortcut: { key: "Digit1", display: "1" },
  },
  {
    to: "/?tab=add-recipe",
    labelKey: "nav.addRecipe",
    fallback: "ADD RECIPE",
    icon: PencilLine,
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
    icon: ListChecks,
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
    icon: Warehouse,
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
    icon: Wand2,
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
    icon: Leaf,
    shortcut: { key: "Digit7", display: "7" },
  },
  {
    to: "/?tab=haccp",
    labelKey: "nav.haccpCompliance",
    fallback: "HACCP/Compliance",
    icon: Shield,
    shortcut: { key: "Digit8", display: "8" },
  },
  {
    to: "/?tab=waste-tracking",
    labelKey: "nav.wasteTracking",
    fallback: "WASTE TRACKING",
    icon: Trash,
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
    icon: ImageIcon,
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
        "group flex w-full items-center text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed
          ? "justify-center gap-0 px-1.5 py-1.5"
          : "gap-1.5 px-2.5 py-1.5",
        isActive
          ? "text-primary"
          : "text-foreground/60 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-all duration-500",
          isActive ? "scale-110" : "group-hover:scale-110 group-hover:translate-y-[-2px]",
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
            "pointer-events-auto absolute left-0 top-20 z-[3200] flex flex-col overflow-hidden rounded-3xl transition-all duration-1000",
            "bg-white/8 dark:bg-white/3",
            "border border-white/20 dark:border-white/8",
            "shadow-[0_8px_32px_0px_rgba(31,38,135,0.05)]",
            "backdrop-blur-2xl",
            collapsed ? "w-14 space-y-2 p-2" : "w-60 space-y-3.5 p-4",
          )}
          style={{ maxHeight: "calc(100% - 80px)" }}
        >
          <div className="relative flex h-full flex-col">
            <div
              className={cn(
                "flex items-center gap-2 transition-all duration-500",
                collapsed ? "justify-center gap-1" : "justify-start",
              )}
            >
              {!collapsed ? (
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/50 px-2.5 py-0.5">
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
                  "flex w-full items-center px-2.5 py-1.5 font-medium text-foreground/75 transition-all duration-300 hover:text-foreground",
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
                  "flex items-center justify-between px-2.5 py-1.5 text-sm font-medium text-foreground/75 transition-all duration-300",
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
              className="group absolute right-[-18px] top-1/2 z-10 -translate-y-1/2 select-none rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
                padding: "10px 6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.1)";
              }}
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
