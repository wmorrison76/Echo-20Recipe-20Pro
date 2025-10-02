import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  HelpCircle,
  Images,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Sprout,
  Save,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: "/?tab=search", label: "RECIPES", icon: BookOpenCheck },
  { to: "/?tab=add-recipe", label: "ADD RECIPE", icon: PenSquare },
  { to: "/?tab=server-notes", label: "SERVER NOTES", icon: ClipboardList },
  { to: "/?tab=production", label: "PRODUCTION", icon: Factory },
  { to: "/?tab=saas", label: "SaaS", icon: Sparkles },
  { to: "/?tab=inventory", label: "Inventory & Supplies", icon: Boxes },
  { to: "/?tab=nutrition", label: "Nutrition/Allergens", icon: Sprout },
  { to: "/?tab=haccp", label: "HACCP/Compliance", icon: ShieldCheck },
  { to: "/?tab=gallery", label: "Gallery", icon: Images },
];

type TabLinkProps = NavItem & {
  collapsed: boolean;
};

function TabLink({ to, label, icon: Icon, collapsed }: TabLinkProps) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("tab") ?? "search";
  const value = new URLSearchParams(to.split("?")[1] || "").get("tab") || "";
  const isActive = active === value;

  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "group flex w-full items-center rounded-md text-sm font-medium transition-all duration-700",
        collapsed ? "justify-center gap-0 px-2 py-2" : "gap-2 px-3 py-2",
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
      <span
        aria-hidden={collapsed}
        className={cn(
          "ml-2 overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-700 ease-out",
          collapsed ? "ml-0 max-w-0 opacity-0" : "max-w-[180px] opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export default function TopTabs() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCollapsed(true);
    }, 425);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (collapsed) {
      setShowHelp(false);
    }
  }, [collapsed]);

  const isAdd = new URLSearchParams(location.search).get("tab") === "add-recipe";

  const textClass = (extra?: string) =>
    cn(
      "overflow-hidden whitespace-nowrap transition-all duration-700 ease-out",
      collapsed ? "max-w-0 opacity-0" : "max-w-full opacity-100",
      extra,
    );

  return (
    <>
      <aside
        className={cn(
          "fixed left-4 top-4 z-[1000] relative flex flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur-xl transition-all duration-700 dark:border-slate-800/80 dark:bg-slate-950/75 dark:shadow-[0_0_30px_rgba(56,189,248,0.28)]",
          collapsed ? "w-16 space-y-3 p-3" : "w-64 space-y-4 p-4",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-500",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 transition-all duration-700",
              collapsed ? "gap-0" : "gap-2",
            )}
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F3daeec161e9e466b9f19d163a3c58f71?format=webp&width=240"
              alt="Echo Recipe Pro"
              className="h-7 w-auto"
            />
            <span
              aria-hidden={collapsed}
              className={textClass(
                "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
              )}
            >
              Echo Recipe Pro
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCollapsed(true);
            }}
            className={cn(
              "rounded-full border border-white/40 bg-white/70 p-2 text-muted-foreground shadow-sm transition duration-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200",
              collapsed && "pointer-events-none opacity-0",
            )}
            aria-label="Collapse navigation"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav
          className={cn(
            "max-h-[70vh] space-y-1 overflow-y-auto pr-1 transition-all duration-700",
            collapsed && "pr-0",
          )}
        >
          {navItems.map((item) => (
            <TabLink key={item.to} collapsed={collapsed} {...item} />
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
            title="Finalize & Clear"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("recipe:action", {
                  detail: { type: "finalizeImport" },
                }),
              );
            }}
            className={cn(
              "flex w-full items-center rounded-md bg-white/70 px-3 py-2 font-medium text-foreground shadow-sm transition duration-300 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900",
              collapsed ? "justify-center px-2" : "justify-between",
            )}
          >
            <span aria-hidden={collapsed} className={textClass("text-sm font-medium")}>
              Finalize & Clear
            </span>
            <Save className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            title="Help & Shortcuts"
            onClick={() => setShowHelp(true)}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 font-medium text-foreground transition duration-300 hover:bg-white/70 dark:hover:bg-slate-900/70",
              collapsed ? "justify-center px-2" : "justify-between",
            )}
          >
            <span aria-hidden={collapsed} className={textClass("text-sm font-medium")}>
              Help & Shortcuts
            </span>
            <HelpCircle className="h-4 w-4" aria-hidden />
          </button>

          {!collapsed && isAdd && (
            <div className="rounded-lg border border-white/40 bg-white/60 p-3 text-xs text-muted-foreground shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
              <div className="mb-2 text-sm font-semibold text-foreground">
                Add Recipe Tools
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("recipe:action", {
                        detail: { type: "convertUnits" },
                      }),
                    )
                  }
                  className="rounded border border-white/40 px-2 py-1 font-medium text-foreground transition hover:bg-white/70 dark:border-slate-700/60 dark:hover:bg-slate-900/70"
                >
                  Convert Units
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("recipe:action", {
                        detail: { type: "saveVersion" },
                      }),
                    )
                  }
                  className="rounded border border-white/40 px-2 py-1 font-medium text-foreground transition hover:bg-white/70 dark:border-slate-700/60 dark:hover:bg-slate-900/70"
                >
                  Save Snapshot
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("recipe:action", {
                        detail: { type: "convertUnits" },
                      }),
                    )
                  }
                  className="rounded border border-white/40 px-2 py-1 font-medium text-foreground transition hover:bg-white/70 dark:border-slate-700/60 dark:hover:bg-slate-900/70"
                >
                  Alt Units
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("recipe:action", {
                        detail: { type: "cycleCurrency" },
                      }),
                    )
                  }
                  className="rounded border border-white/40 px-2 py-1 font-medium text-foreground transition hover:bg-white/70 dark:border-slate-700/60 dark:hover:bg-slate-900/70"
                >
                  Currency
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("recipe:action", {
                        detail: { type: "openYieldLab" },
                      }),
                    )
                  }
                  className="rounded border border-white/40 px-2 py-1 font-medium text-foreground transition hover:bg-white/70 dark:border-slate-700/60 dark:hover:bg-slate-900/70"
                >
                  Yield Lab
                </button>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-700 dark:bg-slate-900/70",
              collapsed && "flex-col gap-2 px-2 py-2",
            )}
          >
            <span aria-hidden={collapsed} className={textClass("text-sm font-medium")}> 
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className={cn(
            "absolute right-[-14px] top-1/2 flex h-10 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-muted-foreground shadow-lg transition duration-300 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900",
            collapsed ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-label="Expand navigation"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </aside>

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
                Use Add Recipe to type/paste. “Save” persists immediately. CSV
                export includes Directions; Share and SMS send a formatted
                recipe.
              </li>
              <li>
                Import from the web: paste a URL in the right sidebar. The
                importer reads JSON‑LD or page sections, pulls times/yield, and
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
                for a flipbook with click, swipe or arrow-key navigation.
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
