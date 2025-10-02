import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, Save } from "lucide-react";

const navItems = [
  { to: "/?tab=search", label: "RECIPES" },
  { to: "/?tab=add-recipe", label: "ADD RECIPE" },
  { to: "/?tab=server-notes", label: "SERVER NOTES" },
  { to: "/?tab=production", label: "PRODUCTION" },
  { to: "/?tab=saas", label: "SaaS" },
  { to: "/?tab=inventory", label: "Inventory & Supplies" },
  { to: "/?tab=nutrition", label: "Nutrition/Allergens" },
  { to: "/?tab=haccp", label: "HACCP/Compliance" },
  { to: "/?tab=gallery", label: "Gallery" },
] as const;

function TabLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("tab") ?? "search";
  const value = new URLSearchParams(to.split("?")[1] || "").get("tab") || "";
  const isActive = active === value;

  return (
    <Link
      to={to}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-primary text-primary-foreground shadow"
          : "text-foreground/75 hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function TopTabs() {
  const location = useLocation();
  const [showHelp, setShowHelp] = React.useState(false);
  const isAdd = new URLSearchParams(location.search).get("tab") === "add-recipe";

  return (
    <aside className="flex h-full min-h-screen w-64 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <a href="/?tab=search" className="flex items-center gap-2" aria-label="Home">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F3daeec161e9e466b9f19d163a3c58f71?format=webp&width=360"
            alt="Echo Recipe Pro"
            className="h-9"
          />
          <span className="sr-only">Echo Recipe Pro</span>
        </a>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <TabLink key={item.to} to={item.to} label={item.label} />
        ))}
      </nav>

      <div className="space-y-3 border-t px-3 py-4">
        <button
          title="Finalize & Clear"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("recipe:action", {
                detail: { type: "finalizeImport" },
              }),
            );
          }}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <span>Finalize & Clear</span>
          <Save className="h-4 w-4" />
        </button>
        <button
          title="Help"
          onClick={() => setShowHelp(true)}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <span>Help & Shortcuts</span>
          <HelpCircle className="h-4 w-4" />
        </button>

        {isAdd && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="mb-2 text-sm font-semibold text-foreground">
              Add Recipe Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                title="Convert Units"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "convertUnits" },
                    }),
                  )
                }
                className="rounded border px-2 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Convert Units
              </button>
              <button
                title="Save Snapshot"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "saveVersion" },
                    }),
                  )
                }
                className="rounded border px-2 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Save Snapshot
              </button>
              <button
                title="Alt Units"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "convertUnits" },
                    }),
                  )
                }
                className="rounded border px-2 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Alt Units
              </button>
              <button
                title="Currency"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "cycleCurrency" },
                    }),
                  )
                }
                className="rounded border px-2 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Currency
              </button>
              <button
                title="R&D Labs (Yield Lab)"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "openYieldLab" },
                    }),
                  )
                }
                className="rounded border px-2 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Yield Lab
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </div>

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
    </aside>
  );
}
