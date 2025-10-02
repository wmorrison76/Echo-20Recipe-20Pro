import * as React from "react";
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Boxes,
  ClipboardList,
  Factory,
  HelpCircle,
  Images,
  Menu,
  PanelLeftClose,
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

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
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

type TabLinkProps = {
  to: string;
  label: string;
  icon: LucideIcon;
};

function TabLink({ to, label, icon: Icon }: TabLinkProps) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("tab") ?? "search";
  const value = new URLSearchParams(to.split("?")[1] || "").get("tab") || "";
  const isActive = active === value;

  return (
    <Link
      to={to}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-primary text-primary-foreground shadow"
          : "text-foreground/75 hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function TopTabs() {
  const location = useLocation();
  const [open, setOpen] = React.useState(true);
  const [showHelp, setShowHelp] = React.useState(false);
  const isAdd = new URLSearchParams(location.search).get("tab") === "add-recipe";

  const togglePanel = () => {
    setOpen((prev) => !prev);
    setShowHelp(false);
  };

  return (
    <>
      {open && (
        <aside className="fixed left-4 top-4 z-[1000] w-64 space-y-4 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur-xl transition dark:border-slate-800/80 dark:bg-slate-950/75 dark:shadow-[0_0_30px_rgba(56,189,248,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F3daeec161e9e466b9f19d163a3c58f71?format=webp&width=240"
                alt="Echo Recipe Pro"
                className="h-7 w-auto"
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Echo Recipe Pro
              </span>
            </div>
            <button
              onClick={togglePanel}
              className="rounded-full border border-white/40 bg-white/70 p-2 text-muted-foreground shadow-sm transition hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200"
              aria-label="Collapse navigation"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <nav className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => (
              <TabLink key={item.to} {...item} />
            ))}
          </nav>

          <div className="space-y-3 border-t border-white/50 pt-3 text-sm dark:border-slate-800/60">
            <button
              title="Finalize & Clear"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("recipe:action", {
                    detail: { type: "finalizeImport" },
                  }),
                );
              }}
              className="flex w-full items-center justify-between rounded-md bg-white/70 px-3 py-2 font-medium text-foreground shadow-sm transition hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900"
            >
              <span>Finalize & Clear</span>
              <Save className="h-4 w-4" aria-hidden />
            </button>
            <button
              title="Help"
              onClick={() => setShowHelp(true)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 font-medium text-foreground transition hover:bg-white/70 dark:hover:bg-slate-900/70"
            >
              <span>Help & Shortcuts</span>
              <HelpCircle className="h-4 w-4" aria-hidden />
            </button>

            {isAdd && (
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

            <div className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm font-medium text-foreground shadow-sm dark:bg-slate-900/70">
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>
      )}

      {!open && (
        <button
          onClick={togglePanel}
          className="fixed left-4 top-4 z-[1001] rounded-full border border-white/60 bg-white/80 p-3 text-foreground shadow-lg backdrop-blur-md transition hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
          aria-label="Show navigation"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      )}

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
